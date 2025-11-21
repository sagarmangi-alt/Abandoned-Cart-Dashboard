import { AbandonedCart } from "@/types/cart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  User,
  Package,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

interface DetailModalProps {
  cart: AbandonedCart | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// A reusable component for each section in the modal
const InfoSection = ({ title, icon: Icon, children }) => (
  <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-5">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-3 text-gray-50">
      <Icon className="h-5 w-5 text-blue-400" />
      {title}
    </h3>
    {children}
  </div>
);

// A redesigned component to display a single piece of information
const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-start gap-4 ${className}`}>
    <Icon className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
    <div className="flex-1">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="font-semibold text-gray-50 break-words">{String(value) || 'N/A'}</div>
    </div>
  </div>
);

// A consistent badge for displaying status
const StatusBadge = ({ positive, children }) => (
  <Badge variant={positive ? "outline" : "secondary"} className={positive ? "border-green-500/50 bg-green-500/10 text-green-400" : "bg-slate-700 text-gray-400"}>
    {positive ? <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
    {children}
  </Badge>
);

export const DetailModal = ({ cart, open, onOpenChange }: DetailModalProps) => {
  if (!cart) return null;

  // Split product names by '&' or 'and'
  const productNames = cart.product_name?.split(/\s*&\s*|\s*and\s*/i) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-gray-50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-50">Cart Details</DialogTitle>
          <DialogDescription>
            Complete information for the abandoned cart created on {cart.created_at ? format(new Date(cart.created_at), "PPP") : "N/A"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer & Location */}
          <InfoSection title="Customer Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <InfoRow icon={User} label="Name" value={cart.first_name} />
              <InfoRow icon={Mail} label="Email" value={cart.email} />
              <InfoRow icon={Phone} label="Phone" value={cart.phone} />
              <InfoRow icon={MapPin} label="Location" value={`${cart.city}, ${cart.country}`} />
            </div>
          </InfoSection>

          {/* Product & Order */}
          <InfoSection title="Product & Order" icon={Package}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* MODIFIED: Custom product display section */}
              <div className="flex items-start gap-4 md:col-span-2">
                <Package className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Product(s)</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {productNames.length > 0 ? productNames.map((product, index) => (
                      <Badge key={index} variant="secondary" className="bg-slate-700 text-gray-200 font-medium">
                        {product.trim()}
                      </Badge>
                    )) : (
                      <div className="font-semibold text-gray-50">N/A</div>
                    )}
                  </div>
                </div>
              </div>

              <InfoRow icon={DollarSign} label="Original Price" value={`$${cart.original_price?.toFixed(2)}`} />
              <InfoRow icon={FileText} label="Checkout ID" value={cart.checkout_id} />
              <InfoRow icon={Calendar} label="Date Abandoned" value={cart.created_at ? format(new Date(cart.created_at), "MMM dd, yyyy 'at' hh:mm a") : "N/A"} />
            </div>
          </InfoSection>

          {/* Call Outcome */}
          <InfoSection title="Call Outcome" icon={Phone}>
            <div className="flex flex-wrap gap-3 mb-4">
              <StatusBadge positive={cart.call_successful}>{cart.call_status}</StatusBadge>
              <StatusBadge positive={cart.interested}>{cart.interested ? "Interested" : "Not Interested"}</StatusBadge>
              <StatusBadge positive={cart.bought_from_automation}> {cart.bought_from_automation ? "Purchased" : "Did Not Purchase"}</StatusBadge>
              <StatusBadge positive={cart.agreed_to_get_sms}>{cart.agreed_to_get_sms ? "SMS Agreed" : "No SMS"}</StatusBadge>
            </div>
            <InfoRow icon={Info} label="Call End Reason" value={cart.ended_reason} />
            {cart.recording_url && (
              <div className="mt-4">
                <div className="text-sm text-gray-400 mb-2">Call Recording</div>
                <audio controls className="w-full">
                  <source src={cart.recording_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </InfoSection>

          {/* Conversation Details */}
          {(cart.transcript || cart.summary) && (
            <InfoSection title="Conversation" icon={MessageSquare}>
              {cart.summary && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">AI Summary</h4>
                  <blockquote className="border-l-4 border-blue-500 bg-slate-700/50 p-3 pl-4 text-sm text-gray-300 italic rounded-r-md">
                    {cart.summary}
                  </blockquote>
                </div>
              )}
              {cart.transcript && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Full Transcript</h4>
                  <div className="bg-slate-700/50 p-3 rounded-md text-sm max-h-60 overflow-y-auto text-gray-300 whitespace-pre-wrap">
                    {cart.transcript}
                  </div>
                </div>
              )}
            </InfoSection>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};