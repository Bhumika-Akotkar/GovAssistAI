import { Stats } from "./Stats";

const Banners = () => {
  return (
    <section className="section section-sm">
      <div className="wrap flex flex-col gap-6">
        <img
          src="/assets/homeimage/wp-banner.png"
          alt="Get help on WhatsApp with Sahayak Seva"
          className="block w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]"
              />
              <Stats/>
        <img
          src="/assets/homeimage/offline-call-banner.png"
          alt="No internet? No problem. Call Sahayak Seva for help."
          className="block w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]"
        />
      </div>
    </section>
  );
};

export default Banners;
