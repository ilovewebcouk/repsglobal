import type { HelpArticle } from "./types";
import { article as gettingStartedSetup } from "./articles/getting-started-setup";
import { article as gettingStartedFreeVerified } from "./articles/getting-started-free-verified";
import { article as verificationOverview } from "./articles/verification-overview";
import { article as verificationIdentity } from "./articles/verification-identity";
import { article as verificationQualifications } from "./articles/verification-qualifications";
import { article as verificationInsurance } from "./articles/verification-insurance";
import { article as verificationRejected } from "./articles/verification-rejected";
import { article as verificationTimeline } from "./articles/verification-timeline";
import { article as profileWriting } from "./articles/profile-writing";
import { article as profilePhoto } from "./articles/profile-photo";
import { article as profileSlug } from "./articles/profile-slug";
import { article as profileServiceLocations } from "./articles/profile-service-locations";
import { article as enquiriesReceive } from "./articles/enquiries-receive";
import { article as reviewsRequest } from "./articles/reviews-request";
import { article as reviewsReply } from "./articles/reviews-reply";
import { article as reviewsRemoved } from "./articles/reviews-removed";
import { article as accountBillingPlans } from "./articles/account-billing-plans";
import { article as accountCancel } from "./articles/account-cancel";
import { article as accountDataExport } from "./articles/account-data-export";
import { article as trustConduct } from "./articles/trust-conduct";
import { article as trustComplaints } from "./articles/trust-complaints";
import { article as troubleshootSignIn } from "./articles/troubleshoot-signin";
import { article as troubleshootEmail } from "./articles/troubleshoot-email";
import { article as troubleshootUploads } from "./articles/troubleshoot-uploads";

export const HELP_ARTICLES: HelpArticle[] = [
  gettingStartedSetup,
  gettingStartedFreeVerified,
  verificationOverview,
  verificationIdentity,
  verificationQualifications,
  verificationInsurance,
  verificationTimeline,
  verificationRejected,
  profileWriting,
  profilePhoto,
  profileSlug,
  profileServiceLocations,
  enquiriesReceive,
  reviewsRequest,
  reviewsReply,
  reviewsRemoved,
  accountBillingPlans,
  accountCancel,
  accountDataExport,
  trustConduct,
  trustComplaints,
  troubleshootSignIn,
  troubleshootEmail,
  troubleshootUploads,
];

export function getArticle(category: string, slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.category === category && a.slug === slug);
}

export function getArticlesByCategory(category: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === category && !a.hidden);
}

export function getRelated(article: HelpArticle): HelpArticle[] {
  if (!article.related?.length) return [];
  return article.related
    .map((id) => {
      const [category, slug] = id.split("/");
      return HELP_ARTICLES.find((a) => a.category === category && a.slug === slug);
    })
    .filter((x): x is HelpArticle => Boolean(x));
}

/** Lightweight client-safe summaries (no Body) for search/index */
export function getArticleSummaries() {
  return HELP_ARTICLES.filter((a) => !a.hidden).map((a) => {
    const { Body: _Body, ...rest } = a;
    return rest;
  });
}
