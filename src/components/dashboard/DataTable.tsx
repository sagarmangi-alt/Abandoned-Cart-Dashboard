import { useState, useMemo } from "react";
import { AbandonedCart } from "@/types/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Eye, Volume2, CheckCircle, XCircle, ArrowUpDown, Filter, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { AudioPlayerModal } from "./AudioPlayerModal";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps {
  data: AbandonedCart[];
  onViewDetails: (cart: AbandonedCart) => void;
  isLoading: boolean;
}

type SortableKey = 'first_name' | 'short_product_name' | 'original_price' | 'created_at';
type FilterStatus = 'all' | 'yes' | 'no';

export const DataTable = ({ data, onViewDetails, isLoading }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<{ url: string; name: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortableKey; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });
  const [filters, setFilters] = useState<{
    interested: FilterStatus;
    bought_from_automation: FilterStatus;
    answered_by_ai: FilterStatus;
  }>({
    interested: 'all',
    bought_from_automation: 'all',
    answered_by_ai: 'all',
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const processedData = useMemo(() => {
    // 1. Search filter
    let filteredData = data.filter(
      (item) =>
        item.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.short_product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.country?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Status filters
    if (filters.interested !== 'all') {
      const isInterested = filters.interested === 'yes';
      filteredData = filteredData.filter(item => item.interested === isInterested);
    }
    if (filters.bought_from_automation !== 'all') {
      const hasBought = filters.bought_from_automation === 'yes';
      filteredData = filteredData.filter(item => item.bought_from_automation === hasBought);
    }
    if (filters.answered_by_ai !== 'all') {
        const isAiHandled = filters.answered_by_ai === 'yes';
        filteredData = filteredData.filter(item => item.answered_by_ai === isAiHandled);
    }

    // 3. Sorting
    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig, filters]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = processedData.slice(startIndex, startIndex + itemsPerPage);

  const handleListenClick = (cart: AbandonedCart) => {
    setSelectedAudio({
      url: cart.recording_url,
      name: cart.first_name,
    });
    setAudioModalOpen(true);
  };
  
  const handleSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName: keyof typeof filters, value: FilterStatus) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };

  const renderSortableHeader = (key: SortableKey, label: string, className?: string) => (
    <TableHead className={className}>
      <Button variant="ghost" onClick={() => handleSort(key)} className="-ml-4">
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, product, or country..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 bg-slate-800 border-slate-700 text-gray-50 focus:ring-blue-500"
            />
          </div>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-slate-800 border-slate-700 hover:bg-slate-700">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-gray-50">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700"/>

                <DropdownMenuLabel className="font-normal">Interested</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.interested} onValueChange={(value) => handleFilterChange('interested', value as FilterStatus)}>
                    <DropdownMenuRadioItem value="all" className="focus:bg-slate-700">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="yes" className="focus:bg-slate-700">Yes</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="no" className="focus:bg-slate-700">No</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator className="bg-slate-700"/>

                <DropdownMenuLabel className="font-normal">Purchased</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.bought_from_automation} onValueChange={(value) => handleFilterChange('bought_from_automation', value as FilterStatus)}>
                    <DropdownMenuRadioItem value="all" className="focus:bg-slate-700">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="yes" className="focus:bg-slate-700">Yes</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="no" className="focus:bg-slate-700">No</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator className="bg-slate-700"/>

                <DropdownMenuLabel className="font-normal">AI Handled</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={filters.answered_by_ai} onValueChange={(value) => handleFilterChange('answered_by_ai', value as FilterStatus)}>
                    <DropdownMenuRadioItem value="all" className="focus:bg-slate-700">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="yes" className="focus:bg-slate-700">Yes</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="no" className="focus:bg-slate-700">No</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-slate-800">
                <TableRow>
                  {renderSortableHeader('first_name', 'Customer')}
                  {renderSortableHeader('short_product_name', 'Product')}
                  {renderSortableHeader('original_price', 'Price', 'text-right')}
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {renderSortableHeader('created_at', 'Date')}
                  <TableHead className="sticky right-0 bg-slate-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7}>
                        <Skeleton className="h-8 w-full bg-slate-700" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((cart) => (
                    <TableRow key={cart._id} className="border-slate-700 hover:bg-slate-800">
                       <TableCell className="py-3">
                        <div className="font-medium text-gray-50">{cart.first_name}</div>
                        <div className="text-sm text-gray-400">{cart.email}</div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-200">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help line-clamp-2 max-w-[200px]">{cart.product_name}</span>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-700 border-slate-600 text-gray-50">
                            <p>{cart.product_name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-gray-200">${cart.original_price?.toFixed(2)}</div>
                        <div className="text-sm text-green-400 font-semibold">${((cart.original_price || 0) * 0.9).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-200">{cart.city}</div>
                        <div className="text-sm text-gray-400">{cart.country}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1.5">
                           <Badge variant={cart.answered_by_ai ? "outline" : "secondary"} className={`w-full justify-center ${cart.answered_by_ai ? "border-blue-500/50 bg-blue-500/10 text-blue-400" : "bg-slate-700 text-gray-400"}`}>
                             {cart.answered_by_ai ? <CheckCircle className="h-4 w-4 mr-1.5" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                             AI Handled
                           </Badge>
                           <Badge variant={cart.interested ? "outline" : "secondary"} className={`w-full justify-center ${cart.interested ? "border-green-500/50 bg-green-500/10 text-green-400" : "bg-slate-700 text-gray-400"}`}>
                             {cart.interested ? <CheckCircle className="h-4 w-4 mr-1.5" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                             Interested
                           </Badge>
                           <Badge variant={cart.bought_from_automation ? "outline" : "secondary"} className={`w-full justify-center ${cart.bought_from_automation ? "border-purple-500/50 bg-purple-500/10 text-purple-400" : "bg-slate-700 text-gray-400"}`}>
                             {cart.bought_from_automation ? <CheckCircle className="h-4 w-4 mr-1.5" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                             Purchased
                           </Badge>
                         </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {cart.created_at ? format(new Date(cart.created_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-slate-800 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-slate-700">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-gray-50">
                            <DropdownMenuItem onClick={() => onViewDetails(cart)} className="focus:bg-slate-700">
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {cart.recording_url && (
                              <DropdownMenuItem onClick={() => handleListenClick(cart)} className="focus:bg-slate-700">
                                <Volume2 className="h-4 w-4 mr-2" /> Listen to Call
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-10">
                      No results found for the selected criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Rows per page</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 bg-slate-800 border-slate-700 hover:bg-slate-700">
                            {itemsPerPage} <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-800 border-slate-700 text-gray-50">
                        {[10, 20, 30, 40, 50].map(size => (
                            <DropdownMenuItem 
                                key={size}
                                onClick={() => {
                                    setItemsPerPage(size);
                                    setCurrentPage(1);
                                }}
                                className="focus:bg-slate-700"
                            >
                                {size}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

        <AudioPlayerModal
          open={audioModalOpen}
          onOpenChange={setAudioModalOpen}
          audioUrl={selectedAudio?.url || ""}
          customerName={selectedAudio?.name || ""}
        />
      </div>
    </TooltipProvider>
  );
};