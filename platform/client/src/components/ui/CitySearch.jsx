import * as React from "react";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { MAJOR_CITIES } from "@/lib/constants";

export function CitySearch({ value, onChange, placeholder = "Search cities..." }) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [cities, setCities] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // Fetch cities from Photon API
    React.useEffect(() => {
        if (!query || query.length < 2) {
            setCities([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&type=city`
                );
                const data = await response.json();

                const suggestions = data.features.map((feature) => {
                    const { name, state, country } = feature.properties;
                    const label = [name, state, country].filter(Boolean).join(", ");
                    return {
                        value: label,
                        label: label,
                    };
                });

                // Unique suggestions
                const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.value)))
                    .map(val => suggestions.find(s => s.value === val));

                setCities(uniqueSuggestions);
            } catch (error) {
                console.error("City search failed:", error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 border-slate-200  focus:ring-brand-500 font-normal"
                >
                    <div className="flex items-center truncate text-slate-700 gap-2 md:gap-3 lg:gap-4">
                        <MapPin className="h-4 w-4 shrink-0 opacity-50" />
                        {value || placeholder}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2 md:ml-3 lg:ml-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type city name..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center py-2 md:py-3 lg:py-4">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                            </div>
                        )}
                        {!loading && cities.length === 0 && query.length >= 2 && (
                            <div className="text-center text-sm text-slate-500 py-2 md:py-3 lg:py-4">
                                No cities found.
                            </div>
                        )}
                        {!loading && query.length < 2 && (
                            <div className="p-2 md:p-3 lg:p-4">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider px-2 md:px-3 lg:px-4 py-2 md:py-3 lg:py-4">
                                    Popular Choices
                                </p>
                                <div className="grid grid-cols-1 gap-2 md:gap-3 lg:gap-4">
                                    {MAJOR_CITIES.map((city) => (
                                        <CommandItem
                                            key={city}
                                            value={city}
                                            onSelect={(currentValue) => {
                                                onChange(currentValue);
                                                setOpen(false);
                                            }}
                                            className="flex items-center gap-2 md:gap-3 lg:gap-4"
                                        >
                                            <Check
                                                className={cn(
                                                    "h-4 w-4",
                                                    value === city ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {city}
                                        </CommandItem>
                                    ))}
                                </div>
                                <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 mt-2 md:mt-3 lg:mt-4 pt-2 md:pt-3 lg:pt-4 pb-2 md:pb-3 lg:pb-4">
                                    Type more than 2 chars for global search
                                </div>
                            </div>
                        )}
                        <CommandGroup>
                            {cities.map((city) => (
                                <CommandItem
                                    key={city.value}
                                    value={city.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "h-4 w-4 mr-2 md:mr-3 lg:mr-4",
                                            value === city.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {city.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
