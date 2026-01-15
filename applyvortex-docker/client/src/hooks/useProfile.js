// src/hooks/useProfile.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileAPI } from '@/services/api/profileAPI.js';
import { useToast } from '@/hooks/use-toast';

/**
 * Single source of truth for profile fetching/updating.
 * Fetches all data at once and exposes helpers for updates.
 */
export function useProfile() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch full profile once
    const {
        data: profile,
        isLoading,
        isFetching,
        isError,
        error,
    } = useQuery({
        queryKey: ['profile'],
        queryFn: profileAPI.getProfile,
        staleTime: 5 * 60 * 1000, // 5 mins
    });

    // Full update
    const updateProfileMutation = useMutation({
        mutationFn: profileAPI.updateProfile,
        onSuccess: (updated) => {
            queryClient.setQueryData(['profile'], updated);
            toast({
                title: 'Profile updated',
                description: 'Your profile has been saved successfully.',
            });
        },
        onError: (err) => {
            toast({
                title: 'Failed to update profile',
                description:
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong while saving your profile.',
                variant: 'destructive',
            });
        },
    });

    // Section-level helpers (optional but convenient)
    const updatePersonal = useMutation({
        mutationFn: profileAPI.updatePersonal,
        onSuccess: (personal) => {
            queryClient.setQueryData(['profile'], (old) => ({
                ...(old || {}),
                personal,
            }));
            toast({ title: 'Personal info updated' });
        },
        onError: (err) => {
            toast({
                title: 'Failed to update personal info',
                description:
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong.',
                variant: 'destructive',
            });
        },
    });

    const updateExperience = useMutation({
        mutationFn: profileAPI.updateExperience,
        onSuccess: (experience) => {
            queryClient.setQueryData(['profile'], (old) => ({
                ...(old || {}),
                experience,
            }));
            toast({ title: 'Experience updated' });
        },
        onError: (err) => {
            toast({
                title: 'Failed to update experience',
                description:
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong.',
                variant: 'destructive',
            });
        },
    });

    const updateSkills = useMutation({
        mutationFn: profileAPI.updateSkills,
        onSuccess: (skills) => {
            queryClient.setQueryData(['profile'], (old) => ({
                ...(old || {}),
                skills,
            }));
            toast({ title: 'Skills updated' });
        },
        onError: (err) => {
            toast({
                title: 'Failed to update skills',
                description:
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong.',
                variant: 'destructive',
            });
        },
    });

    const updateLinks = useMutation({
        mutationFn: profileAPI.updateLinks,
        onSuccess: (links) => {
            queryClient.setQueryData(['profile'], (old) => ({
                ...(old || {}),
                links,
            }));
            toast({ title: 'Links updated' });
        },
        onError: (err) => {
            toast({
                title: 'Failed to update links',
                description:
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong.',
                variant: 'destructive',
            });
        },
    });

    return {
        // data
        profile,
        isLoading,
        isFetching,
        isError,
        error,

        // full update
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdatingProfile: updateProfileMutation.isPending,

        // section updates
        updatePersonal: updatePersonal.mutateAsync,
        isUpdatingPersonal: updatePersonal.isPending,

        updateExperience: updateExperience.mutateAsync,
        isUpdatingExperience: updateExperience.isPending,

        updateAllSkills: updateSkills.mutateAsync,
        isUpdatingSkills: updateSkills.isPending,

        updateLinks: updateLinks.mutateAsync,
        isUpdatingLinks: updateLinks.isPending,
    };
}
