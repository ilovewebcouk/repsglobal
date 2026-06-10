import { cn } from "@/lib/utils";

type RepsWordmarkProps = {
  className?: string;
  title?: string;
};

/**
 * REPs wordmark — Inter ExtraBold (28pt, 25 tracking) converted to outlined SVG paths.
 * Paths generated from the Inter ExtraBold TTF (UPEM 2048) with Illustrator's
 * 25/1000 em tracking baked into per-glyph X offsets.
 * Inherits colour from `currentColor`, so set text colour via Tailwind (e.g. text-white).
 * Width is derived from the viewBox; size by setting a height class.
 */
export function RepsWordmark({ className, title = "REPs" }: RepsWordmarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="116 -1510 5257.6 1530"
      fill="currentColor"
      role="img"
      aria-label={title}
      className={cn("h-5 w-auto select-none", className)}
    >
      <g transform="scale(1 -1)">
        <path transform="translate(0 0)" d="M116 0V1490H726Q894 1490 1016.0 1429.5Q1138 1369 1203.5 1258.0Q1269 1147 1269 995Q1269 842 1202.0 733.5Q1135 625 1011.0 569.0Q887 513 716 513H327V792H652Q735 792 790.5 814.0Q846 836 874.5 881.0Q903 926 903 995Q903 1065 874.5 1111.0Q846 1157 790.0 1180.5Q734 1204 651 1204H469V0ZM934 0 571 681H949L1321 0Z" />
        <path transform="translate(1407.2 0)" d="M116 0V1490H1150V1202H469V894H1096V612H469V288H1149V0Z" />
        <path transform="translate(2707.4 0)" d="M116 0V1490H726Q894 1490 1016.0 1425.0Q1138 1360 1203.5 1244.0Q1269 1128 1269 975Q1269 821 1202.0 707.0Q1135 593 1011.0 529.0Q887 465 716 465H338V744H652Q735 744 791.0 773.0Q847 802 875.0 854.0Q903 906 903 975Q903 1045 875.0 1096.5Q847 1148 790.5 1176.0Q734 1204 651 1204H469V0Z" />
        <path transform="translate(4093.6 0)" d="M691 -20Q505 -20 367.0 36.0Q229 92 152.0 206.0Q75 320 72 492H411Q416 420 450.5 371.0Q485 322 545.5 297.5Q606 273 687 273Q760 273 813.0 293.0Q866 313 894.5 349.0Q923 385 923 433Q923 476 896.5 506.0Q870 536 817.0 559.0Q764 582 682 600L524 637Q331 681 221.0 781.0Q111 881 111 1049Q111 1187 186.0 1291.0Q261 1395 391.5 1452.5Q522 1510 691 1510Q864 1510 991.0 1451.5Q1118 1393 1188.0 1288.5Q1258 1184 1260 1046H921Q914 1127 855.0 1172.0Q796 1217 690 1217Q620 1217 572.0 1198.5Q524 1180 500.0 1147.5Q476 1115 476 1073Q476 1027 503.0 995.5Q530 964 580.0 943.0Q630 922 696 907L825 877Q933 854 1017.5 814.5Q1102 775 1160.5 720.0Q1219 665 1249.5 593.0Q1280 521 1280 432Q1280 291 1209.5 189.5Q1139 88 1007.5 34.0Q876 -20 691 -20Z" />
      </g>
    </svg>
  );
}
