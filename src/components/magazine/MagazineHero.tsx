export default function MagazineHero() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-sm font-semibold tracking-wider uppercase text-[#3c8af7] mb-4">
              Magazin
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-gray-900 leading-tight mb-6">
              Wissen für Vermieter &amp; Hausverwaltungen
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-lg">
              Praxisnahes Expertenwissen rund um Mietrecht, Nebenkosten, Steuern und Immobilienmanagement.
            </p>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              <img
                src="https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt=""
                className="rounded-2xl object-cover w-full h-48 md:h-56"
              />
              <img
                src="https://images.pexels.com/photos/7578939/pexels-photo-7578939.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt=""
                className="rounded-2xl object-cover w-full h-48 md:h-56 mt-8"
              />
              <img
                src="https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt=""
                className="rounded-2xl object-cover w-full h-48 md:h-56 -mt-4"
              />
              <img
                src="https://images.pexels.com/photos/5849559/pexels-photo-5849559.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt=""
                className="rounded-2xl object-cover w-full h-48 md:h-56 mt-4"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
