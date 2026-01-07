import { useState } from "react";
import MetersManagementView from "./MetersManagementView";
import MeterModal from "./MeterModal";
import MeterReadingModal from "./MeterReadingModal";
import MeterReadingsHistory from "./MeterReadingsHistory";

export default function MetersView() {
  const [showMeterModal, setShowMeterModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<any | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddMeter = () => {
    setSelectedMeter(null);
    setShowMeterModal(true);
  };

  const handleEditMeter = (meter: any) => {
    setSelectedMeter(meter);
    setShowMeterModal(true);
  };

  const handleAddReading = (meter: any) => {
    setSelectedMeter(meter);
    setShowReadingModal(true);
  };

  const handleViewHistory = (meter: any) => {
    setSelectedMeter(meter);
    setShowHistoryModal(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCloseMeterModal = () => {
    setShowMeterModal(false);
    setSelectedMeter(null);
  };

  const handleCloseReadingModal = () => {
    setShowReadingModal(false);
    setSelectedMeter(null);
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedMeter(null);
  };

  return (
    <>
      <MetersManagementView
        onAddMeter={handleAddMeter}
        onEditMeter={handleEditMeter}
        onAddReading={handleAddReading}
        onViewHistory={handleViewHistory}
        refreshTrigger={refreshTrigger}
      />

      {showMeterModal && (
        <MeterModal
          meter={selectedMeter}
          onClose={handleCloseMeterModal}
          onSuccess={handleSuccess}
        />
      )}

      {showReadingModal && selectedMeter && (
        <MeterReadingModal
          meter={selectedMeter}
          onClose={handleCloseReadingModal}
          onSuccess={handleSuccess}
        />
      )}

      {showHistoryModal && selectedMeter && (
        <MeterReadingsHistory
          meter={selectedMeter}
          onClose={handleCloseHistoryModal}
        />
      )}
    </>
  );
}
