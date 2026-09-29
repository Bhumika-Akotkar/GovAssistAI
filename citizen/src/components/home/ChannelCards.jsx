import { Link } from "react-router-dom";

export function ChannelCards() {
  return (
    <section className="section section-sm">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="section-eyebrow">Multiple ways to reach us</span>
          <h2>Whatever works for you</h2>
          <p>
            Some prefer to type, some to speak, some to call. We've made sure
            Sahayak Seva works the way you do.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              path: "/chat",
              image: "chat-card.png",
              title: "Text chat",
              description:
                "Ask questions in 12+ languages and get clear, step-by-step guidance.",
            },
            {
              path: "/voice",
              image: "voice-card.png",
              title: "Voice assistant",
              description:
                "Speak naturally in your language and get help without typing.",
            },
            {
              path: "/whatsapp",
              image: "wp-card.png",
              title: "WhatsApp bot",
              description:
                "Message Sahayak Seva on WhatsApp. No app download is needed.",
            },
            {
              path: "/help",
              image: "call-card.png",
              title: "Offline call-in",
              description:
                "No internet? Call for government scheme and document guidance.",
            },
          ].map((channel, index) => (
            <Link
              key={channel.path}
              to={channel.path}
              className={`group block overflow-hidden rounded-lg border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-md reveal ${index ? `reveal-d${Math.min(index, 3)}` : ""}`}
            >
              <img
                src={`/assets/heroimg/${channel.image}`}
                alt=""
                className="aspect-[2.2/1] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="p-6 pb-[26px]">
                <h4 className="mb-[9px] text-[1.08rem] font-bold text-ink">
                  {channel.title}
                </h4>
                <p className="mb-[18px] text-[.88rem] leading-[1.6] text-ink-3">
                  {channel.description}
                </p>
                <span className="flex items-center gap-1.5 text-[.76rem] font-semibold text-forest-3">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Available now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
