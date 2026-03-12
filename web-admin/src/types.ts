export type UserRecord = {
  uid: string;
  name?: string;
  phone?: string;
  bloodGroup?: string;
  district?: string;
  verificationStatus?: string;
};

export type PostRecord = {
  postId: string;
  authorUid: string;
  Name?: string;
  District?: string;
  BloodGroup?: string;
  Time?: number;
  moderationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  isVisible?: boolean;
  reviewedAt?: number;
  reviewedBy?: string;
  flagReason?: string;
};

export type ReportRecord = {
  reportId: string;
  reporterUid: string;
  reportedUid: string;
  reason: string;
  timestamp: number;
  contentType: "POST" | "USER";
};

export type BlogRecord = {
  id: string;
  title: string;
  authorName: string;
  content: string;
  createdAt: number;
  publishedAt: number;
};

export type StoryRecord = {
  id: string;
  title: string;
  authorName: string;
  content: string;
  anonymous: boolean;
  createdAt: number;
  publishedAt: number;
};

export type SubmissionType = "blog" | "story";
export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ContentSubmission = {
  id: string;
  type: SubmissionType;
  title: string;
  authorName: string;
  content: string;
  anonymous: boolean;
  status: SubmissionStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
  rejectionReason?: string;
};
