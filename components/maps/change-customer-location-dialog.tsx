'use client';

import { useState, useEffect, ReactElement } from 'react';
import {
  Search,
  MapPin,
  Sparkles,
  Check,
  X,
  Loader2,
  Navigation,
  User,
  Phone,
  Edit3,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  searchPlacesInIndonesia,
  POPULAR_AGRI_LOCATIONS,
  type LocationSearchResult,
} from '@/lib/maps/geocoding-helpers';

export interface CustomerLocationData {
  name: string;
  phone?: string;
  address: string;
  coords: [number, number]; // [lat, lng]
}

export interface ChangeCustomerLocationDialogProps {
  currentCustomer: CustomerLocationData;
  onCustomerLocationChange: (newLocation: CustomerLocationData) => void;
  trigger?: ReactElement;
}

export function ChangeCustomerLocationDialog({
  currentCustomer,
  onCustomerLocationChange,
  trigger,
}: ChangeCustomerLocationDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form states
  const [customerName, setCustomerName] = useState(currentCustomer.name);
  const [customerPhone, setCustomerPhone] = useState(currentCustomer.phone || '');
  const [customerAddress, setCustomerAddress] = useState(currentCustomer.address);
  const [coords, setCoords] = useState<[number, number]>(currentCustomer.coords);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setCustomerName(currentCustomer.name);
      setCustomerPhone(currentCustomer.phone || '');
      setCustomerAddress(currentCustomer.address);
      setCoords(currentCustomer.coords);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Debounced search like Google Maps
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!open || trimmed.length < 2) {
      return;
    }

    let isCancelled = false;
    const handler = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchPlacesInIndonesia(trimmed);
      if (!isCancelled) {
        setSearchResults(results);
        setIsSearching(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(handler);
    };
  }, [searchQuery, open]);

  // If query is short, display popular presets, otherwise display search results
  const displayedResults =
    searchQuery.trim().length >= 2 ? searchResults : POPULAR_AGRI_LOCATIONS;

  // Handle selecting a place from search results
  const handleSelectPlace = (place: LocationSearchResult) => {
    setCoords([place.lat, place.lng]);
    setCustomerAddress(place.displayName);
    setSearchQuery(place.name);
  };

  // Submit and apply new customer location
  const handleSave = () => {
    onCustomerLocationChange({
      name: customerName.trim() || 'Pembeli Kentara',
      phone: customerPhone.trim(),
      address: customerAddress.trim() || 'Alamat tujuan lahan pertanian',
      coords,
    });
    setOpen(false);
  };

  const defaultTrigger = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-9 px-3 rounded-xl border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/50 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
    >
      <Edit3 className="h-3.5 w-3.5 text-emerald-600" />
      <span>Ubah Titik Lokasi Pembeli</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger || defaultTrigger} />

      <DialogContent className="max-w-lg rounded-3xl p-5 sm:p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <MapPin className="h-5 w-5" />
            <DialogTitle className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white">
              Cari &amp; Atur Lokasi Pembeli
            </DialogTitle>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cari alamat tujuan seperti di Google Maps atau pilih sentra pertanian untuk memperbarui rute navigasi kurir.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Google Maps Style Search Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cari Alamat / Kota / Sentra Pertanian</span>
            </Label>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Ketik nama jalan, desa, kecamatan, atau kota..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-11 rounded-2xl border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm bg-zinc-50/50 dark:bg-zinc-950/50 focus-visible:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Autocomplete Search Results Dropdown List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold px-1">
              <span>{searchQuery.trim().length >= 2 ? 'Hasil Pencarian Alamat' : 'Rekomendasi Sentra Pertanian'}</span>
              {isSearching && (
                <span className="flex items-center gap-1 text-emerald-600 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Mencari...
                </span>
              )}
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1.5 bg-zinc-50/40 dark:bg-zinc-950/40 divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {displayedResults.length > 0 ? (
                displayedResults.map((place) => {
                  const isSelected =
                    Math.abs(coords[0] - place.lat) < 0.0001 &&
                    Math.abs(coords[1] - place.lng) < 0.0001;

                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="h-7 w-7 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-xs font-bold block truncate">
                            {place.name}
                          </strong>
                          {isSelected && (
                            <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                              Terpilih
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                          {place.displayName}
                        </p>
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 block mt-0.5">
                          {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-zinc-500">
                  Tidak ditemukan lokasi dengan kata kunci &quot;{searchQuery}&quot;.
                </div>
              )}
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Cepat:
            </span>
            {POPULAR_AGRI_LOCATIONS.slice(0, 4).map((pop) => (
              <button
                key={pop.id}
                type="button"
                onClick={() => handleSelectPlace(pop)}
                className="text-[10px] px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer"
              >
                {pop.name}
              </button>
            ))}
          </div>

          {/* Customer Details Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <User className="h-3 w-3" />
                Nama Petani / Pembeli
              </Label>
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Bpk. Subardi"
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                No. Telepon Pembeli
              </Label>
              <Input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Coordinate Indicator */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-semibold block">
                  Koordinat Tujuan Aktif
                </span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 font-bold">
                  {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
                </span>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5">
              Siap Dinavigasi
            </Badge>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-xl h-10 text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="rounded-xl h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>Terapkan Rute Baru</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
