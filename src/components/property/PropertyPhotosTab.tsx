import { useState, useEffect, useRef } from "react";
import { Upload, X, ChevronLeft, ChevronRight, MoreVertical, Check } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface PropertyImage {
  id: string;
  property_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  title: string | null;
  category: string;
  note: string | null;
  is_cover: boolean;
  visible_in_tenant_portal: boolean;
  created_at: string;
  updated_at: string;
}

interface PropertyPhotosTabProps {
  propertyId: string;
}

const categories = ["Alle", "Aussen", "Innen", "Treppenhaus", "Technik", "Zustand", "Sonstiges"];

export default function PropertyPhotosTab({ propertyId }: PropertyPhotosTabProps) {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Alle");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  useEffect(() => {
    loadImages();
  }, [propertyId]);

  useEffect(() => {
    filterAndSortImages();
  }, [images, selectedCategory, sortOrder]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortImages = () => {
    let filtered = [...images];

    if (selectedCategory !== "Alle") {
      filtered = filtered.filter((img) => img.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredImages(filtered);
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Möchten Sie ${selectedImageIds.length} Bild(er) wirklich löschen?`)) return;

    try {
      const imagesToDelete = images.filter((img) => selectedImageIds.includes(img.id));

      for (const image of imagesToDelete) {
        const filePath = image.file_url;
        await supabase.storage.from("property-photos").remove([filePath]);
        await supabase.from("property_images").delete().eq("id", image.id);
      }

      setSelectedImageIds([]);
      setMultiSelectMode(false);
      loadImages();
    } catch (error) {
      console.error("Error deleting images:", error);
      alert("Fehler beim Löschen der Bilder");
    }
  };

  const handleBulkCategoryChange = async (category: string) => {
    try {
      await supabase
        .from("property_images")
        .update({ category })
        .in("id", selectedImageIds);

      setSelectedImageIds([]);
      setMultiSelectMode(false);
      loadImages();
    } catch (error) {
      console.error("Error updating categories:", error);
      alert("Fehler beim Aktualisieren der Kategorien");
    }
  };

  const handleBulkVisibilityChange = async (visible: boolean) => {
    try {
      await supabase
        .from("property_images")
        .update({ visible_in_tenant_portal: visible })
        .in("id", selectedImageIds);

      setSelectedImageIds([]);
      setMultiSelectMode(false);
      loadImages();
    } catch (error) {
      console.error("Error updating visibility:", error);
      alert("Fehler beim Aktualisieren der Sichtbarkeit");
    }
  };

  const openDetailModal = (image: PropertyImage) => {
    setSelectedImage(image);
    setDetailModalOpen(true);
    setDropdownOpen(null);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedImage(null);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedImage) return;
    const currentIndex = filteredImages.findIndex((img) => img.id === selectedImage.id);
    let newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0) newIndex = filteredImages.length - 1;
    if (newIndex >= filteredImages.length) newIndex = 0;
    setSelectedImage(filteredImages[newIndex]);
  };

  const handleSetCover = async (imageId: string) => {
    try {
      await supabase
        .from("property_images")
        .update({ is_cover: true })
        .eq("id", imageId);
      setDropdownOpen(null);
      loadImages();
    } catch (error) {
      console.error("Error setting cover:", error);
      alert("Fehler beim Setzen des Titelbilds");
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Möchten Sie dieses Bild wirklich löschen?")) return;

    try {
      const image = images.find((img) => img.id === imageId);
      if (!image) return;

      await supabase.storage.from("property-photos").remove([image.file_url]);
      await supabase.from("property_images").delete().eq("id", imageId);

      setDropdownOpen(null);
      if (detailModalOpen) closeDetailModal();
      loadImages();
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Fehler beim Löschen des Bilds");
    }
  };

  const getImageUrl = (image: PropertyImage) => {
    const { data } = supabase.storage.from("property-photos").getPublicUrl(image.file_url);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-400">Lädt...</div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-dark">Bilder zur Immobilie</h2>
            <p className="text-gray-400 mt-1">Laden Sie Fotos hoch, um Zustand, Ausstattung und Besonderheiten zu dokumentieren.</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Bilder hochladen
          </button>
        </div>

        <div
          onClick={() => setUploadModalOpen(true)}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Dateien hier ablegen oder auswählen</p>
          <p className="text-sm text-gray-400">JPG/PNG, max. 10 MB pro Bild</p>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Empfohlen: Außenansicht, Eingangsbereich, Treppenhaus, typische Einheit
        </p>

        {uploadModalOpen && (
          <UploadModal
            propertyId={propertyId}
            onClose={() => setUploadModalOpen(false)}
            onSuccess={loadImages}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Bilder ({images.length})</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedImageIds([]);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              multiSelectMode ? "bg-gray-400 text-white" : "bg-gray-100 hover:bg-gray-200 text-dark"
            }`}
          >
            {multiSelectMode ? "Abbrechen" : "Auswählen"}
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-primary-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Bilder hochladen
          </button>
        </div>
      </div>

      {multiSelectMode && selectedImageIds.length > 0 && (
        <div className="mb-6 p-4 rounded-lg flex items-center justify-between bg-blue-50">
          <span className="font-medium">{selectedImageIds.length} Bild(er) ausgewählt</span>
          <div className="flex gap-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkCategoryChange(e.target.value);
                  e.target.value = "";
                }
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              defaultValue=""
            >
              <option value="" disabled>Kategorie ändern</option>
              {categories.filter((c) => c !== "Alle").map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => handleBulkVisibilityChange(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Im Portal anzeigen
            </button>
            <button
              onClick={() => handleBulkVisibilityChange(false)}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Im Portal verbergen
            </button>
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-red-600 transition-colors"
            >
              Löschen
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredImages.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            multiSelectMode={multiSelectMode}
            isSelected={selectedImageIds.includes(image.id)}
            onToggleSelect={() => toggleImageSelection(image.id)}
            onOpen={() => openDetailModal(image)}
            onSetCover={() => handleSetCover(image.id)}
            onDelete={() => handleDeleteImage(image.id)}
            getImageUrl={getImageUrl}
            dropdownOpen={dropdownOpen === image.id}
            setDropdownOpen={(open) => setDropdownOpen(open ? image.id : null)}
          />
        ))}
      </div>

      {uploadModalOpen && (
        <UploadModal
          propertyId={propertyId}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={loadImages}
        />
      )}

      {detailModalOpen && selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={closeDetailModal}
          onUpdate={loadImages}
          onNavigate={navigateImage}
          onDelete={() => handleDeleteImage(selectedImage.id)}
          onSetCover={() => handleSetCover(selectedImage.id)}
          getImageUrl={getImageUrl}
          hasNext={filteredImages.length > 1}
          hasPrev={filteredImages.length > 1}
        />
      )}
    </div>
  );
}

interface ImageCardProps {
  image: PropertyImage;
  multiSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onSetCover: () => void;
  onDelete: () => void;
  getImageUrl: (image: PropertyImage) => string;
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
}

function ImageCard({
  image,
  multiSelectMode,
  isSelected,
  onToggleSelect,
  onOpen,
  onSetCover,
  onDelete,
  getImageUrl,
  dropdownOpen,
  setDropdownOpen,
}: ImageCardProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen, setDropdownOpen]);

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={(e) => {
        if (multiSelectMode) {
          onToggleSelect();
        } else if (!dropdownOpen) {
          onOpen();
        }
      }}
    >
      {multiSelectMode && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
              isSelected ? "bg-primary-blue border-primary-blue" : "bg-white border-gray-300"
            }`}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      {image.is_cover && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs font-medium text-white bg-primary-blue">
          Titelbild
        </div>
      )}

      {!multiSelectMode && (
        <div className="absolute top-2 right-2 z-10" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(!dropdownOpen);
            }}
            className="p-1.5 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Öffnen
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCover();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
              >
                Als Titelbild setzen
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-red-600"
              >
                Löschen
              </button>
            </div>
          )}
        </div>
      )}

      <div className="aspect-video overflow-hidden bg-gray-100">
        <img
          src={getImageUrl(image)}
          alt={image.title || image.file_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-dark truncate mb-1">
          {image.title || image.file_name}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{new Date(image.created_at).toLocaleDateString("de-DE")}</span>
          <span>{image.category}</span>
        </div>
      </div>
    </div>
  );
}

interface UploadModalProps {
  propertyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ propertyId, onClose, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [defaultCategory, setDefaultCategory] = useState("Sonstiges");
  const [useTitleFromFilename, setUseTitleFromFilename] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles = Array.from(selectedFiles).filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} ist keine gültige Bilddatei`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} ist größer als 10 MB`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${propertyId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const { error: uploadError } = await supabase.storage
          .from("property-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        setUploadProgress((prev) => ({ ...prev, [file.name]: 50 }));

        const title = useTitleFromFilename ? file.name.replace(/\.[^/.]+$/, "") : null;

        const { error: dbError } = await supabase.from("property_images").insert({
          property_id: propertyId,
          user_id: user.id,
          file_url: fileName,
          file_name: file.name,
          title,
          category: defaultCategory,
        });

        if (dbError) throw dbError;

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Fehler beim Hochladen der Bilder");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-dark">Bilder hochladen</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors mb-6"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Dateien hier ablegen oder auswählen</p>
            <p className="text-sm text-gray-400">JPG/PNG, max. 10 MB pro Bild</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-dark mb-3">{files.length} Datei(en) ausgewählt</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    {uploading && uploadProgress[file.name] !== undefined && (
                      <span className="text-xs text-gray-400 ml-2">{uploadProgress[file.name]}%</span>
                    )}
                    {!uploading && (
                      <button
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                        className="ml-2 p-1 hover:bg-gray-200 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Standard-Kategorie für alle Bilder
              </label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={uploading}
              >
                {categories.filter((c) => c !== "Alle").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useTitleFromFilename"
                checked={useTitleFromFilename}
                onChange={(e) => setUseTitleFromFilename(e.target.checked)}
                disabled={uploading}
                className="w-4 h-4"
              />
              <label htmlFor="useTitleFromFilename" className="text-sm text-dark">
                Titel aus Dateinamen übernehmen
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-dark transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="px-4 py-2 rounded-lg font-medium bg-primary-blue hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
          >
            {uploading ? "Lädt hoch..." : "Hochladen"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ImageDetailModalProps {
  image: PropertyImage;
  onClose: () => void;
  onUpdate: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onDelete: () => void;
  onSetCover: () => void;
  getImageUrl: (image: PropertyImage) => string;
  hasNext: boolean;
  hasPrev: boolean;
}

function ImageDetailModal({
  image,
  onClose,
  onUpdate,
  onNavigate,
  onDelete,
  onSetCover,
  getImageUrl,
  hasNext,
  hasPrev,
}: ImageDetailModalProps) {
  const [title, setTitle] = useState(image.title || "");
  const [category, setCategory] = useState(image.category);
  const [note, setNote] = useState(image.note || "");
  const [visibleInPortal, setVisibleInPortal] = useState(image.visible_in_tenant_portal);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from("property_images")
        .update({
          title: title || null,
          category,
          note: note || null,
          visible_in_tenant_portal: visibleInPortal,
        })
        .eq("id", image.id);

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating image:", error);
      alert("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-dark">Bilddetails</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="relative">
            <img
              src={getImageUrl(image)}
              alt={image.title || image.file_name}
              className="w-full rounded-lg"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => onNavigate("prev")}
                disabled={!hasPrev}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => onNavigate("next")}
                disabled={!hasNext}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bildtitel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {categories.filter((c) => c !== "Alle").map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">Notiz</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional: Zusätzliche Informationen zum Bild"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-50">
              <input
                type="checkbox"
                id="visibleInPortal"
                checked={visibleInPortal}
                onChange={(e) => setVisibleInPortal(e.target.checked)}
                className="w-4 h-4"
              />
              <div>
                <label htmlFor="visibleInPortal" className="text-sm font-medium text-dark block">
                  Im Mieterportal anzeigen
                </label>
                <p className="text-xs text-gray-400">Nur aktivieren, wenn Mieter dieses Bild sehen sollen.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <button
                onClick={onSetCover}
                className="w-full px-4 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-dark transition-colors"
              >
                Als Titelbild setzen
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2 rounded-lg font-medium bg-primary-blue hover:bg-blue-600 text-white transition-colors"
              >
                {saving ? "Speichert..." : "Speichern"}
              </button>

              <button
                onClick={onDelete}
                className="w-full px-4 py-2 rounded-lg font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
