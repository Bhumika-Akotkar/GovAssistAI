import { useEffect, useState } from 'react';

import { useSession } from '../hooks/useSession';
import { useLanguage } from '../i18n/LanguageProvider';
import { Outbox, OutboxStatus } from '../offline/Outbox';
import { BUNDLED_VERSION } from '../lib/catalog';

import { SyncBanner } from '../components/sync/SyncBanner';
import { SyncQueueList } from '../components/sync/SyncQueueList';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';

const COPY = {
  en: {
    title: 'Sync status',
    subtitle: 'Messages are saved on this device and sent as soon as there is a connection.',
    syncNow: 'Sync now',
    syncing: 'Syncing…',
    clearCompleted: 'Clear completed',
    lastSync: 'Last successful sync',
    never: 'Never',
    justNow: 'Just now',
    installTitle: 'Add Sahayak Seva to your home screen',
    installBody: 'Install it for faster access and use it even without a network connection.',
    install: 'Install app',
    installed: 'Installed',
    updateTitle: 'A new version is available',
    updateBody: 'Reload to get the latest scheme guidance and fixes.',
    update: 'Reload now',
    storageTitle: 'Stored on this device',
    storageSubtitle: 'Your scheme guides are downloaded and readable with no network at all.',
    versions: (local, remote) =>
      local && remote ? `Local copy ${local} · server copy ${remote}` : `Local copy ${local || 'unknown'}`,
    refreshFailed: 'Could not reach the server to check for updates. The local copy is still fully usable.',
    offlineBannerTitle: 'No connection',
    queueTitle: 'Message queue',
    bgSyncNote:
      'Your browser can retry uploads on its own, but that feature is unreliable on some Android and Firefox builds. The queue above is the guarantee — it is checked whenever the app comes back online, comes into view, or every minute while you are online.',
  },
  hi: {
    title: 'सिंक स्थिति',
    subtitle: 'संदेश इस डिवाइस पर सुरक्षित रहते हैं और कनेक्शन मिलते ही भेज दिए जाते हैं।',
    syncNow: 'अभी सिंक करें',
    syncing: 'सिंक हो रहा है…',
    clearCompleted: 'पूर्ण हुए हटाएं',
    lastSync: 'अंतिम सफल सिंक',
    never: 'कभी नहीं',
    justNow: 'अभी-अभी',
    installTitle: 'सहायक सेवा को अपनी होम स्क्रीन पर जोड़ें',
    installBody: 'तेज पहुंच के लिए इंस्टॉल करें और बिना नेटवर्क के भी उपयोग करें।',
    install: 'ऐप इंस्टॉल करें',
    installed: 'इंस्टॉल हो गया',
    updateTitle: 'नया संस्करण उपलब्ध है',
    updateBody: 'नवीनतम योजना मार्गदर्शन और सुधारों के लिए पेज दोबारा लोड करें।',
    update: 'अभी दोबारा लोड करें',
    storageTitle: 'इस डिवाइस पर संग्रहीत',
    storageSubtitle: 'आपके योजना गाइड डाउनलोड हो चुके हैं और बिना नेटवर्क के पढ़े जा सकते हैं।',
    versions: (local, remote) =>
      local && remote ? `स्थानीय प्रति ${local} · सर्वर प्रति ${remote}` : `स्थानीय प्रति ${local || 'अज्ञात'}`,
    refreshFailed: 'अपडेट देखने के लिए सर्वर से संपर्क नहीं हो सका। स्थानीय प्रति पूरी तरह काम करती है।',
    offlineBannerTitle: 'कोई कनेक्शन नहीं',
    queueTitle: 'संदेश कतार',
    bgSyncNote:
      'आपका ब्राउज़र खुद अपलोड दोबारा कर सकता है, लेकिन कुछ Android और Firefox संस्करणों में यह विश्वसनीय नहीं है। ऊपर की कतार ही गारंटी है — ऐप ऑनलाइन आने, दिखने, या ऑनलाइन होने पर हर मिनट जाँची जाती है।',
  },
  mr: {
    title: 'सिंक स्थिती',
    subtitle: 'संदेश या डिव्हाइसवर सुरक्षित राहतातात आणि कनेक्शन मिळाल्यावर पाठवले जातात.',
    syncNow: 'आत्ता सिंक करा',
    syncing: 'सिंक होत आहे…',
    clearCompleted: 'पूर्ण झालेले काढा',
    lastSync: 'शेवटची यशस्वी सिंक',
    never: 'कधीही नाही',
    justNow: 'आत्ताच',
    installTitle: 'सहाय्य सेवा तुमच्या होम स्क्रीनवर जोडा',
    installBody: 'लवकर प्रवेशासाठी इन्स्टॉल करा आणि नेटवर्कशिवायही वापरा.',
    install: 'अ‍ॅप इन्स्टॉल करा',
    installed: 'इन्स्टॉल झाले',
    updateTitle: 'नवीन आवृत्ती उपलब्ध',
    updateBody: 'नवीनतम योजना मार्गदर्शन आणि दुरुस्तीसाठी पृष्ठ पुन्हा लोड करा.',
    update: 'आत्ता पुन्हा लोड करा',
    storageTitle: 'या डिव्हाइसवर साठवलेले',
    storageSubtitle: 'तुमची योजना मार्गदर्शने डाउनलोड झाली आहेत आणि नेटवर्कशिवाय वाचता येतात.',
    versions: (local, remote) =>
      local && remote ? `स्थानिक प्रत ${local} · सर्व्हर प्रत ${remote}` : `स्थानिक प्रत ${local || 'अज्ञात'}`,
    refreshFailed: 'अद्यतने तपासण्यासाठी सर्व्हरशी संपर्क होऊ शकला नाही. स्थानिक प्रत पूर्णपणे चालू आहे.',
    offlineBannerTitle: 'कनेक्शन नाही',
    queueTitle: 'संदेश रांग',
    bgSyncNote:
      'तुमचा ब्राउझर स्वतःहून पुन्हा अपलोड करू शकतो, पण काही Android आणि Firefox आवृत्त्यांत हे विश्वसनीय नाही. वरील रांग हाच खात्री आहे — ऐप ऑनलाइन झाल्यावर, दिसायला लागल्यावर किंवा ऑनलाइन असताना दर मिनिटाला तपासली जाते.',
  },
  ta: {
    title: 'சிங்க் நிலை',
    subtitle: 'செய்திகள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டு, இணைப்பு கிடைத்ததும் அனுப்பப்படுகின்றன.',
    syncNow: 'இப்போது சிங்க் செய்',
    syncing: 'சிங்க் ஆகிறது…',
    clearCompleted: 'முடிந்தவற்றை அழி',
    lastSync: 'கடைசி வெற்றிகரமான சிங்க்',
    never: 'ஒருபோதும் இல்லை',
    justNow: 'இப்போதுதான்',
    installTitle: 'சஹாயக் சேவையை உங்கள் முகப்புத் திரையில் சேர்க்கவும்',
    installBody: 'வேகமான அணுகலுக்கு நிறுவியுங்கள், இணைப்பின்றியும் பயன்படுத்துங்கள்.',
    install: 'ஆப் நிறுவி',
    installed: 'நிறுவப்பட்டது',
    updateTitle: 'புதிய பதிப்பு உள்ளது',
    updateBody: 'சமீபத்திய திட்ட வழிகாட்டல் மற்றும் பிழைத் திருத்தங்களுக்கு பக்கத்தை மீண்டும் ஏற்றுங்கள்.',
    update: 'இப்போது மீண்டும் ஏற்று',
    storageTitle: 'இந்தச் சாதனத்தில் சேமித்துள்ளது',
    storageSubtitle: 'உங்கள் திட்ட வழிகாட்டல்கள் இறக்கப்பட்டு, இணைப்பின்றி படிக்க முடியும்.',
    versions: (local, remote) =>
      local && remote ? `உள்ளைப் பிரதி ${local} · சர்வர் பிரதி ${remote}` : `உள்ளைப் பிரதி ${local || 'தெரியாதது'}`,
    refreshFailed: 'புதுப்பிப்புகளைச் சரிபார்க்கச் சர்வரை அணுக முடியவில்லை. உள்ளைப் பிரதி முழுமையாகப் பயன்படுகிறது.',
    offlineBannerTitle: 'இணைப்பு இல்லை',
    queueTitle: 'செய்தி வரிசை',
    bgSyncNote:
      'உங்கள் உலாவி தானாக மீண்டும் பதிவிடலாம், ஆனால் சில Android மற்றும் Firefox பதிப்புகளில் இது நம்பகமற்றது. மேலே உள்ள வரிசையே உறுதி — ஆப் ஆன்லைன் ஆனபோது, தோன்றும்போது, அல்லது ஆன்லைன் இருக்கும்போது நிமிடத்துக்கொonce சரிபார்க்கப்படுகிறது.',
  },
  te: {
    title: 'సింక్ స్థితి',
    subtitle: 'సందేశాలు ఈ పరికరంలో భద్రంగా ఉంటాయి, కనెక్షన్ వచ్చిన వెంటనే పంపబడతాయి.',
    syncNow: 'ఇప్పుడే సింక్ చేయి',
    syncing: 'సింక్ అవుతోంది…',
    clearCompleted: 'పూర్తైనవి తొలగించు',
    lastSync: 'చివరి విజయవంతమైన సింక్',
    never: 'ఎప్పుడూ కాదు',
    justNow: 'ఇప్పుడే',
    installTitle: 'సహాయక్ సేవను మీ హోమ్ స్క్రీన్‌కు జోడించండి',
    installBody: 'వేగంగా చేరుకోవడానికి ఇన్‌స్టాల్ చేయండి, నెట్‌వర్క్ లేకుండానీ వాడండి.',
    install: 'యాప్ ఇన్‌స్టాల్ చేయి',
    installed: 'ఇన్‌స్టాల్ అయింది',
    updateTitle: 'కొత్తి వెర్షన్ అందుబాటులో ఉంది',
    updateBody: 'తాజా పథక మార్గదర్శకం మరియు సవరణల కోసం పేజీ మళ్లీ లోడ్ చేయండి.',
    update: 'ఇప్పుడే మళ్లీ లోడ్ చేయి',
    storageTitle: 'ఈ పరికరంలో నిల్వ',
    storageSubtitle: 'మీ పథక మార్గదర్శకాలు డౌన్‌లోడ్ అయ్యాయి, నెట్‌వర్క్ లేకుండా చదవవచ్చు.',
    versions: (local, remote) =>
      local && remote ? `స్థానిక కాపీ ${local} · సర్వర్ కాపీ ${remote}` : `స్థానిక కాపీ ${local || 'తెలియదు'}`,
    refreshFailed: 'అప్‌డేట్‌లు చూడడానికి సర్వర్‌ను చేరుకోలేకపోయాము. స్థానిక కాపీ పూర్తిగా పనిచేస్తుంది.',
    offlineBannerTitle: 'కనెక్షన్ లేదు',
    queueTitle: 'సందేశ క్యూ',
    bgSyncNote:
      'మీ బ్రౌజర్ దానంతటే మళ్లీ అప్‌లోడ్ చేయగలదు, కానీ కొన్ని Android మరియు Firefox బిల్డులలో ఇది నమ్మకమైనది కాదు. పైన ఉన్న క్యూయే హామీ — యాప్ ఆన్‌లైన్ అయినప్పుడు, కనిపించినప్పుడు, లేదా ఆన్‌లైన్‌లో ఉన్నప్పుడు ప్రతి నిమిషానికీ తనిఖీ చేస్తుంది.',
  },
  bn: {
    title: 'সিঙ্ক অবস্থা',
    subtitle: 'বার্তা এই ডিভাইসে সংরক্ষিত থাকে এবং সংযোগ এলেই পাঠানো হয়।',
    syncNow: 'এখনই সিঙ্ক করুন',
    syncing: 'সিঙ্ক হচ্ছে…',
    clearCompleted: 'সম্পন্ন মুছুন',
    lastSync: 'শেষ সফল সিঙ্ক',
    never: 'কখনও নয়',
    justNow: 'এইমাত্র',
    installTitle: 'সহায়ক সেবা আপনার হোম স্ক্রিনে যোগ করুন',
    installBody: 'দ্রুত প্রবেশের জন্য ইনস্টল করুন এবং নেটওয়ার্ক ছাড়াই ব্যবহার করুন।',
    install: 'অ্যাপ ইনস্টল করুন',
    installed: 'ইনস্টল হয়েছে',
    updateTitle: 'নতুন সংস্করণ উপলব্ধ',
    updateBody: 'সর্বশেষ প্রকল্প নির্দেশিকা ও সংশোধনের জন্য পাতা আবার লোড করুন।',
    update: 'এখনই আবার লোড করুন',
    storageTitle: 'এই ডিভাইসে সংরক্ষিত',
    storageSubtitle: 'আপনার প্রকল্প নির্দেশিকা ডাউনলোড হয়েছে এবং নেটওয়ার্ক ছাড়াই পড়া যায়।',
    versions: (local, remote) =>
      local && remote ? `স্থানীয় অনুলিপি ${local} · সার্ভার অনুলিপি ${remote}` : `স্থানীয় অনুলিপি ${local || 'অজানা'}`,
    refreshFailed: 'আপডেট দেখতে সার্ভারে পৌঁছানো যায়নি। স্থানীয় অনুলিপি সম্পূর্ণভাবে কাজ করছে।',
    offlineBannerTitle: 'সংযোগ নেই',
    queueTitle: 'বার্তা সারি',
    bgSyncNote:
      'আপনার ব্রাউজার নিজে থেকে আবার আপলোড করতে পারে, তবে কিছু Android ও Firefox বিল্ডে এটি নির্ভরযোগ্য নয়। উপরের সারিই আসল নিশ্চয়তা — অ্যাপ অনলাইন হলে, দৃশ্যমান হলে, বা অনলাইন থাকা অবস্থায় প্রতি মিনিটে পরীক্ষা করা হয়।',
  },
};

function relativeTime(iso, languageCode) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const rtf = new Intl.RelativeTimeFormat(languageCode, { numeric: 'auto' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.floor(hours / 24), 'day');
}

export default function SyncStatusPage() {
  const { language } = useLanguage();
  const { isOnline, outbox, manualSync, retryItem, clearCompleted } = useSession();

  const [items, setItems] = useState([]);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [remoteError, setRemoteError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  const copy = COPY[language.code] || COPY.en;

  const load = async () => {
    const rows = await Outbox.getAll();
    setItems(rows);
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 4000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // The catalog ETag is how the client learns a newer version exists without
  // downloading the whole thing.
  useEffect(() => {
    if (!isOnline) return;
    let alive = true;
    fetch('/api/services/catalog', { headers: { Accept: 'application/json' } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        if (alive) {
          setRemoteVersion(data.version);
          setRemoteError(false);
        }
      })
      .catch(() => alive && setRemoteError(true));
    return () => {
      alive = false;
    };
  }, [isOnline]);

  const localVersion = BUNDLED_VERSION;

  const handleSync = async () => {
    setIsSyncing(true);
    manualSync();
    setLastSyncAt(new Date().toISOString());
    // Give the flush a beat to land before re-reading the queue.
    setTimeout(async () => {
      await load();
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div className="min-h-full">
      <SyncBanner isOnline={isOnline} syncStatus={outbox} languageCode={language.code} />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <header>
          <h1 className="font-display text-3xl text-ink mb-2">{copy.title}</h1>
          <p className="text-ink-2 text-sm">{copy.subtitle}</p>
        </header>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-ink-3">{copy.lastSync}</p>
              <p className="text-sm text-ink mt-0.5">
                {lastSyncAt
                  ? relativeTime(lastSyncAt, language.code)
                  : copy.never}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSync} loading={isSyncing} disabled={!isOnline || isSyncing}>
                {isSyncing ? copy.syncing : copy.syncNow}
              </Button>
            </div>
          </div>
        </Card>

        {!isOnline && (
          <Card variant="outlined" className="p-5 bg-mustard/5 border-mustard/30">
            <h2 className="font-medium text-ink mb-1">{copy.offlineBannerTitle}</h2>
            <p className="text-sm text-ink-2">{copy.bgSyncNote}</p>
          </Card>
        )}

        <section aria-labelledby="queue-title">
          <h2 id="queue-title" className="sr-only">
            {copy.queueTitle}
          </h2>
          <SyncQueueList
            items={items}
            languageCode={language.code}
            onRetry={retryItem}
            onClearCompleted={clearCompleted}
          />
          <p className="text-xs text-ink-3 mt-3 leading-relaxed">{copy.bgSyncNote}</p>
        </section>

        <Card className="p-5">
          <h2 className="font-medium text-ink mb-1">{copy.storageTitle}</h2>
          <p className="text-sm text-ink-2 mb-3">{copy.storageSubtitle}</p>
          <p className="text-xs text-ink-3">{copy.versions(localVersion, remoteVersion)}</p>
          {remoteError && (
            <p className="text-xs text-ink-3 mt-2">{copy.refreshFailed}</p>
          )}
        </Card>

        {remoteVersion && localVersion && remoteVersion !== localVersion && (
          <Card variant="accent" className="p-5">
            <h2 className="font-medium text-ink mb-1">{copy.updateTitle}</h2>
            <p className="text-sm text-ink-2 mb-3">{copy.updateBody}</p>
            <Button
              onClick={() => window.location.reload()}
            >
              {copy.update}
            </Button>
          </Card>
        )}

        {installPrompt && !installed && (
          <Card className="p-5">
            <h2 className="font-medium text-ink mb-1">{copy.installTitle}</h2>
            <p className="text-sm text-ink-2 mb-3">{copy.installBody}</p>
            <Button onClick={() => installPrompt.prompt()}>
              {copy.install}
            </Button>
          </Card>
        )}

        {installed && (
          <div className="flex items-center gap-2 text-sm text-ink-3">
            <Pill variant="success">{copy.installed}</Pill>
          </div>
        )}
      </div>
    </div>
  );
}
