import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TrackedResource, ResourceType } from '@/types/analytics';
import type { Json } from '@/integrations/supabase/types';

export function useTrackedResources() {
  return useQuery({
    queryKey: ['tracked-resources'],
    queryFn: async (): Promise<TrackedResource[]> => {
      const { data, error } = await supabase
        .from('tracked_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TrackedResource[];
    },
  });
}

export function useTrackedResource(id: string | null) {
  return useQuery({
    queryKey: ['tracked-resource', id],
    queryFn: async (): Promise<TrackedResource | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('tracked_resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TrackedResource;
    },
    enabled: !!id,
  });
}

export function useAddTrackedResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resource: {
      url: string;
      resource_type: ResourceType;
      name: string;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('tracked_resources')
        .insert({
          url: resource.url,
          resource_type: resource.resource_type,
          name: resource.name,
          metadata: (resource.metadata || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TrackedResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-resources'] });
    },
  });
}

export function useUpdateTrackedResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<TrackedResource, 'metadata'>> & { metadata?: Record<string, unknown> };
    }) => {
      const { metadata, ...rest } = updates;
      const updatePayload = {
        ...rest,
        updated_at: new Date().toISOString(),
        ...(metadata !== undefined && { metadata: metadata as Json }),
      };
      
      const { data, error } = await supabase
        .from('tracked_resources')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TrackedResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-resources'] });
    },
  });
}

export function useDeleteTrackedResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tracked_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-resources'] });
    },
  });
}

export function useToggleNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }) => {
      const { data, error } = await supabase
        .from('tracked_resources')
        .update({ notifications_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TrackedResource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracked-resources'] });
    },
  });
}
