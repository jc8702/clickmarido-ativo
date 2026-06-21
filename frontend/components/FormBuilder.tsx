'use client';

import React from 'react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { useState } from 'react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

interface FormBuilderProps {
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void>;
  submitText?: string;
}

export function FormBuilder({
  title,
  description,
  fields,
  onSubmit,
  submitText = 'Enviar',
}: FormBuilderProps) {
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
      setFormData(fields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {}));
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, general: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-neutral-600 mt-1">{description}</p>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-4 bg-warning-50 border-l-4 border-warning-600 text-warning-900 rounded-md animate-slide-down">
              {errors.general}
            </div>
          )}

          {fields.map((field, idx) => (
            <div key={field.name} style={{ animationDelay: `${idx * 50}ms` }} className="animate-fade-in">
              {field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2 rounded-md border-2 border-neutral-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all duration-200 min-h-[128px]"
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-4 py-2 rounded-md border-2 border-neutral-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all duration-200"
                  required={field.required}
                >
                  <option value="">{field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  name={field.name}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  error={errors[field.name]}
                  required={field.required}
                />
              )}
            </div>
          ))}

          <Button fullWidth isLoading={isLoading} type="submit">
            {submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
