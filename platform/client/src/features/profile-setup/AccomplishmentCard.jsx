import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Award, Trash2, Tag } from 'lucide-react';
import { Controller } from 'react-hook-form';

const CATEGORY_OPTIONS = [
    { value: 'achievement', label: 'Achievement' },
    { value: 'award', label: 'Award' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'volunteering', label: 'Volunteering' },
    { value: 'patent', label: 'Patent' },
    { value: 'publication', label: 'Publication' },
    { value: 'other', label: 'Other' },
];



export default function AccomplishmentCard({
    form,
    index,
    onRemove,
    canRemove,
    isReadOnly,
}) {
    const { register, formState: { errors } } = form;
    const descriptionValue = form.watch(`accomplishments.${index}.description`);
    const [charCount, setCharCount] = useState(0);

    const getError = (field) => formState.errors?.accomplishments?.[index]?.[field];

    useEffect(() => {
        setCharCount(descriptionValue?.length || 0);
    }, [descriptionValue]);

    return (
        <div className={`w-full rounded-xl border bg-white shadow-sm ${isReadOnly ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-blue-500/50 transition-colors'}`}>
            <div className="w-full bg-slate-50 rounded-xl flex items-center justify-between p-3 lg:p-4">
                <div className="flex flex-col items-start justify-start gap-3 lg:gap-4">
                    <h3 className="text-lg font-medium leading-none tracking-tight">
                        {`Accomplishment ${index + 1}`}
                    </h3>
                    <h3 className="text-brand-500 font-medium">
                        {form.watch(`accomplishments.${index}.title`)}</h3>
                </div>
                {canRemove && !isReadOnly && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="h-10 w-10 p-0 text-slate-500 hover:text-red-600 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="p-3 lg:p-4 space-y-2 md:space-y-3 lg:space-y-4">
                <div className="grid md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                    {/* Title */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`accomplishment-title-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`accomplishment-title-${index}`}
                            placeholder="e.g. President of Student Council"
                            {...register(`accomplishments.${index}.title`)}
                            disabled={isReadOnly}
                            error={errors?.accomplishments?.[index]?.title?.message}
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`accomplishment-category-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Category <span className="text-red-500">*</span>
                        </Label>
                        <Controller
                            control={form.control}
                            name={`accomplishments.${index}.category`}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={isReadOnly}
                                >
                                    <SelectTrigger
                                        id={`accomplishment-category-${index}`}
                                        className={errors?.accomplishments?.[index]?.category ? 'border-red-500 focus:border-red-500' : ''}
                                    >
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORY_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors?.accomplishments?.[index]?.category && (
                            <p className="text-xs text-red-500">
                                {errors.accomplishments[index].category.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2 md:space-y-3 lg:space-y-4">
                    <Label htmlFor={`accomplishment-description-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                        Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                        id={`accomplishment-description-${index}`}
                        placeholder="Briefly describe what you achieved..."
                        rows={3}
                        {...register(`accomplishments.${index}.description`)}
                        disabled={isReadOnly}
                        error={errors?.accomplishments?.[index]?.description?.message}
                    />
                    <div className="flex justify-end pt-2 md:pt-3 lg:pt-4">
                        <p className={`text-sm font-medium ${charCount > 1000 ? 'text-red-500' : 'text-slate-500'}`}>
                            {charCount}/1000
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
