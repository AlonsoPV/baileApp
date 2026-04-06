export type OrganizerGalleryItem = {
  id: string;
  slot: string;
  url: string;
  kind: "photo" | "video";
  created_at?: string;
  title?: string;
};

export type UploadQueueStatus = "queued" | "uploading" | "success" | "error";

export type UploadQueueItem = {
  id: string;
  file: File;
  slot: string;
  previewUrl: string;
  progress: number;
  status: UploadQueueStatus;
  error?: string;
};
