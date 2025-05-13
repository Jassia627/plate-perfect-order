import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
}

const ImageUpload = ({
  value,
  onChange,
  maxSizeMB = 2
}: ImageUploadProps) => {
  const [loading, setLoading] = useState(false);
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > maxSizeBytes) {
      toast.error(`El archivo es demasiado grande. El tamaño máximo es ${maxSizeMB}MB`);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    
    setLoading(true);
    
    try {
      // Convertir la imagen a Base64
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          // Esta es la URL en formato base64
          const base64Url = event.target.result;
          
          // Limitamos el tamaño para evitar problemas con la base de datos
          if (base64Url.length > 1024 * 1024) { // Si es mayor a 1MB en base64
            toast.error(`La imagen es demasiado grande después de la conversión. Por favor, usa una imagen más pequeña.`);
            setLoading(false);
            return;
          }
          
          // Llamamos al onChange con la URL base64
          onChange(base64Url);
          toast.success("Imagen cargada correctamente");
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error("Error al leer el archivo");
        setLoading(false);
      };
      
      // Comienza la lectura del archivo como URL de datos
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error al cargar la imagen:", error);
      toast.error(`Error al cargar la imagen: ${error.message}`);
      setLoading(false);
    }
  };
  
  const handleRemoveImage = () => {
    onChange("");
  };
  
  return (
    <div className="space-y-2">
      {!value ? (
        // Upload input when no image is selected
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="picture" className="text-sm font-medium">
            Imagen del plato
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
            <Label
              htmlFor="picture"
              className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-primary/50 px-3 py-2 text-center text-sm hover:bg-primary/5 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-2">
                    Procesando...
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground mt-2">
                    Haz clic para subir una imagen
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tamaño máximo: {maxSizeMB}MB
                  </span>
                </>
              )}
            </Label>
          </div>
        </div>
      ) : (
        // Image preview when an image is selected
        <div className="space-y-2">
          <Label className="text-sm font-medium">Imagen del plato</Label>
          <div className="relative aspect-video w-full max-h-[200px] overflow-hidden rounded-md">
            <img
              src={value}
              alt="Imagen del plato"
              className="h-full w-full object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute right-2 top-2"
              onClick={handleRemoveImage}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 