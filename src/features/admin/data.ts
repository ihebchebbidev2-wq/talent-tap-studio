export const statuses = { new: 'Nouvelle', reviewing: 'En cours', shortlisted: 'Présélectionnée', rejected: 'Non retenue' };
export type Status = keyof typeof statuses;
export interface Application {
  id: string; reference: string; full_name: string; phone: string; city: string;
  age_group: string; gender: string; status: Status; created_at: string;
  instagram_url: string; facebook_url: string; tiktok_url: string; social_url?: string; video_url: string; notes: string; interests: string[];
  experience: boolean | null; consent: boolean; photos: { id: string; position: number }[];
}
export type ApplicationSummary = Pick<Application, 'id' | 'reference' | 'full_name' | 'phone' | 'city' | 'age_group' | 'gender' | 'status' | 'created_at'> & { photo_id: string | null };
export const date = (value: string) => new Intl.DateTimeFormat('fr-TN', { dateStyle: 'medium', timeZone: 'Africa/Tunis' }).format(new Date(value));