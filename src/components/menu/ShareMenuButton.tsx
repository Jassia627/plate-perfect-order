import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QrCode, Share2, Copy, Check, Globe } from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

interface ShareMenuButtonProps {
  adminId: string;
}

const ShareMenuButton = ({ adminId }: ShareMenuButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const menuUrl = `${window.location.origin}/menu/${adminId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="flex gap-2 items-center" 
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        <span>Compartir menú</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir menú</DialogTitle>
            <DialogDescription>
              Comparte el enlace del menú con tus clientes
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Input
                value={menuUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex justify-center p-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCode 
                  value={menuUrl} 
                  size={200}
                  fgColor="#000"
                  bgColor="#fff"
                />
              </div>
            </div>
            
            <div className="flex justify-center gap-2">
              <Button 
                onClick={handleCopy}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copiar enlace
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(menuUrl, '_blank')}
                className="gap-2"
              >
                <Globe className="h-4 w-4" />
                Abrir menú
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareMenuButton; 