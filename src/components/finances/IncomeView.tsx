import { useState } from "react";

export default function IncomeView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark">Einnahmen</h2>
        <p className="text-gray-400 mt-1">
          Zentrale Übersicht aller Zahlungseingänge (Mieten und sonstige Einnahmen)
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-6">
        <p className="text-gray-500">
          Die Einnahmen-Ansicht wird bald verfügbar sein. Hier werden Mieteinnahmen aus dem Modul "Mieteingänge" (read-only) sowie manuell erfassbare sonstige Einnahmen angezeigt.
        </p>
      </div>
    </div>
  );
}
