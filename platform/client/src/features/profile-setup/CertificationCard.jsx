import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/checkbox';
import { Controller } from 'react-hook-form';
import { Award, Calendar, Link as LinkIcon, Building, Trash2 } from 'lucide-react';

export default function CertificationCard({
    form,
    index,
    onRemove,
    canRemove,
    isReadOnly,
}) {
    const { register, formState: { errors } } = form;

    return (
        <div className={`w-full rounded-xl border bg-white shadow-sm ${isReadOnly ? 'bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-blue-500/50 transition-colors'}`}>
            <div className="w-full bg-slate-50 rounded-xl flex items-center justify-between p-3 lg:p-4">
                <div className="flex flex-col items-start justify-start gap-3 lg:gap-4">
                    <h3 className="text-lg font-medium leading-none tracking-tight">
                        {`Certification ${index + 1}`}
                    </h3>
                    <h3 className="text-brand-500 font-medium flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4">
                        {form.watch(`certifications.${index}.name`)}
                        {form.watch(`certifications.${index}.issuingOrganization`) && (
                            <span className="text-slate-500">| By {form.watch(`certifications.${index}.issuingOrganization`)}</span>
                        )}
                    </h3>
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
                    {/* Name */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`certification-name-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Certification Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`certification-name-${index}`}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            error={errors?.certifications?.[index]?.name?.message}
                            {...register(`certifications.${index}.name`)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Issuing Organization */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`certification-issuer-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Issuing Organization <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`certification-issuer-${index}`}
                            placeholder="e.g. Amazon Web Services"
                            error={errors?.certifications?.[index]?.issuingOrganization?.message}
                            {...register(`certifications.${index}.issuingOrganization`)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Issue Date */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`certification-issueDate-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Issue Date
                        </Label>
                        <Input
                            id={`certification-issueDate-${index}`}
                            type="date"
                            error={errors?.certifications?.[index]?.issueDate?.message}
                            {...register(`certifications.${index}.issueDate`)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`certification-expiryDate-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Expiry Date
                        </Label>
                        <Input
                            id={`certification-expiryDate-${index}`}
                            type="date"
                            error={errors?.certifications?.[index]?.expiryDate?.message}
                            {...register(`certifications.${index}.expiryDate`)}
                            disabled={isReadOnly || form.watch(`certifications.${index}.doesNotExpire`)}
                        />
                    </div>

                    {/* Credential ID */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`certification-credentialId-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Credential ID
                        </Label>
                        <Input
                            id={`certification-credentialId-${index}`}
                            placeholder="Optional"
                            error={errors?.certifications?.[index]?.credentialId?.message}
                            {...register(`certifications.${index}.credentialId`)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Credential URL */}
                    <div className="space-y-2 md:space-y-3 lg:space-y-4">
                        <Label htmlFor={`certification-credentialUrl-${index}`} className="text-sm font-medium leading-none flex items-center gap-2 md:gap-3 lg:gap-4">
                            Credential URL
                        </Label>
                        <Input
                            id={`certification-credentialUrl-${index}`}
                            placeholder="https://..."
                            error={errors?.certifications?.[index]?.credentialUrl?.message}
                            {...register(`certifications.${index}.credentialUrl`)}
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* Does Not Expire Checkbox */}
                    <div className="flex items-center md:col-span-2 space-x-2 md:space-x-3 lg:space-x-4">
                        <Controller
                            name={`certifications.${index}.doesNotExpire`}
                            control={form.control}
                            render={({ field }) => (
                                <Checkbox
                                    id={`certifications.${index}.doesNotExpire`}
                                    checked={!!field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isReadOnly}
                                />
                            )}
                        />
                        <Label
                            htmlFor={`certifications.${index}.doesNotExpire`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            This certification does not expire
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
}
