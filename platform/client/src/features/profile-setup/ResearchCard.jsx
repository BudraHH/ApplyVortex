import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import {
    BookOpen,
    Calendar,
    Users,
    ExternalLink,
    Trash2,
    AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { DateInput } from '@/components/ui/DateInput';
import { Button } from "@/components/ui/Button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';

const RESEARCH_TYPES = [
    { value: 'journal', label: 'Journal Article' },
    { value: 'conference', label: 'Conference Paper' },
    { value: 'thesis', label: 'Thesis/Dissertation' },
    { value: 'patent', label: 'Patent' },
    { value: 'preprint', label: 'Preprint' },
    { value: 'book-chapter', label: 'Book Chapter' },
];

export default function ResearchCard({ form, index, onRemove, canRemove, isReadOnly }) {
    const [abstractCharCount, setAbstractCharCount] = useState(0);

    const abstractValue = form.watch(`research.${index}.abstract`);
    const titleValue = form.watch(`research.${index}.title`) || '';
    const researchTypeValue = form.watch(`research.${index}.researchType`) || '';

    useEffect(() => {
        setAbstractCharCount(abstractValue?.length || 0);
    }, [abstractValue]);

    const getError = (field) => {
        return form.formState.errors?.research?.[index]?.[field];
    };

    const researchTypeLabel = RESEARCH_TYPES.find(t => t.value === researchTypeValue)?.label || `Research #${index + 1}`;

    return (
        <div className={`w-full rounded-xl border bg-white shadow-sm ${isReadOnly ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-blue-500/50 transition-colors'}`}>
            <div className="flex items-center justify-between">
                <div className="w-full bg-slate-50 rounded-xl flex items-center justify-between p-3 lg:p-4">
                    <div className="flex flex-col items-start justify-start gap-3 lg:gap-4">
                        <h3 className="text-lg font-medium leading-none tracking-tight">
                            {`Research ${index + 1}`}
                        </h3>
                        <h3 className="text-brand-500 font-medium">
                            {form.watch(`research.${index}.title`)}</h3>
                    </div>
                </div>
                {canRemove && !isReadOnly && (
                    <div className="flex-shrink-0">
                        <Button
                            type="button"
                            onClick={onRemove}
                            variant="ghost"
                            className="h-10 w-10 p-0 text-slate-500 hover:text-red-600 hover:bg-slate-100"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                {/* Title */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`title-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id={`title-${index}`}
                        placeholder="e.g., Machine Learning Approaches for Climate Prediction"
                        {...form.register(`research.${index}.title`)}
                        disabled={isReadOnly}
                        error={getError('title')}
                    />
                </div>

                {/* Research Type + Publication Date Row */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`researchType-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Type <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={form.control}
                            name={`research.${index}.researchType`}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger
                                        id={`researchType-${index}`}
                                        className={getError('researchType') ? 'border-red-500 focus:border-red-500' : ''}
                                    >
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RESEARCH_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`publicationDate-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Publication Date <span className="text-red-500">*</span>
                        </Label>
                        <DateInput
                            id={`publicationDate-${index}`}
                            type="month"
                            {...form.register(`research.${index}.publicationDate`)}
                            disabled={isReadOnly}
                            error={getError('publicationDate')}
                        />
                    </div>
                </div>

                {/* Authors + Publisher/Venue Row */}
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`authors-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Authors <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`authors-${index}`}
                            placeholder="e.g., John Doe, Jane Smith"
                            {...form.register(`research.${index}.authors`)}
                            disabled={isReadOnly}
                            error={getError('authors')}
                        />
                    </div>

                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`publisher-${index}`} className="text-sm font-medium leading-none">
                            Publisher/Venue <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`publisher-${index}`}
                            placeholder="e.g., IEEE Transactions, Nature"
                            {...form.register(`research.${index}.publisher`)}
                            disabled={isReadOnly}
                            error={getError('publisher')}
                        />
                    </div>
                </div>

                {/* DOI/URL */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`url-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        DOI or URL
                    </Label>
                    <Input
                        id={`url-${index}`}
                        placeholder="e.g., https://doi.org/10.1234/example or https://arxiv.org/..."
                        {...form.register(`research.${index}.url`)}
                        disabled={isReadOnly}
                        error={getError('url')}
                    />
                </div>

                {/* Abstract */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`abstract-${index}`} className="text-sm font-medium leading-none">
                        Abstract <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id={`abstract-${index}`}
                        rows={4}
                        placeholder="Brief summary of the research work..."
                        {...form.register(`research.${index}.abstract`)}
                        disabled={isReadOnly}
                        error={getError('abstract')}
                    />
                    <div className="flex justify-between items-center pt-2 md:pt-3 lg:pt-4">
                        <p className="text-xs text-slate-500">
                            Provide a concise summary of your research
                        </p>
                        <p
                            className={`text-sm font-medium ${abstractCharCount > 450
                                ? 'text-red-500'
                                : abstractCharCount > 0
                                    ? 'text-slate-900'
                                    : 'text-slate-500'
                                }`}
                        >
                            {abstractCharCount}/500
                        </p>
                    </div>
                    {getError('abstract') && (
                        <p className="text-sm text-red-500 flex items-center gap-2 md:gap-3 lg:gap-4">
                            <AlertCircle className="h-3 w-3" />
                            {getError('abstract').message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
