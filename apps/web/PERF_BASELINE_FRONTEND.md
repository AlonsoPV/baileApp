# PERF_BASELINE_FRONTEND

| hook | step | count | p50_ms | p95_ms | max_ms | avg_ms | rows_avg | payload_avg |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| useExploreQuery | fetchPage_total | 7 | 2680 | 3507 | 3571 | 2713 | 43 | 40042 |
| useExploreQuery | main_events_query | 7 | 341 | 1901 | 1933 | 805 | 22 | 24589 |
| useExploreQuery | ensure_weekly_occurrences_rpc | 7 | 861 | 1745 | 2104 | 1037 | 0 | 0 |
| useExploreQuery | refetch_recurring_occurrences | 7 | 214 | 517 | 616 | 275 | 53 | 51218 |
| useExploreQuery | search_parent_matches_events_date | 5 | 309 | 392 | 410 | 311 | 303 | 364601 |
| useExploreQuery | search_v_organizers_public | 5 | 195 | 234 | 242 | 187 | 4 | 39 |
| useExploreQuery | search_events_parent | 5 | 166 | 211 | 222 | 170 | 3 | 31 |
| useExploreQuery | search_events_parent_by_org | 5 | 164 | 168 | 169 | 163 | 7 | 71 |
