# Scaling & Pricing Analysis (1,000 Users)

This document outlines the projected costs and performance considerations for scaling the application to 1,000 active users.

## 1. Firebase Firestore Costs (Spark Plan / free tier)

Firestore costs are based on Reads, Writes, and Deletes.

### Estimated Monthly Activity (per user)
- **100 Reads/day**: Browsing dashboard, checking history, viewing business stats.
- **10 Writes/day**: Recording new transactions, sales, or updating stock.
- **2 Deletes/day**: Cleaning up or moving items to trash.

### Total Activity (1,000 users)
- **Reads**: 100,000 / day (~3,000,000 / month)
- **Writes**: 10,000 / day (~300,000 / month)
- **Deletes**: 2,000 / day (~60,000 / month)

### Estimated Monthly Cost (Beyond Free Tier)
- **Reads**: First 50k/day free. Remaining 50k * 30 = 1.5M reads. (1.5M / 100k) * $0.06 = **$0.90**
- **Writes**: First 20k/day free. 1,000 users at 10/day = 10k/day (Well within free tier). **$0.00**
- **Deletes**: First 20k/day free. 1,000 users at 2/day = 2k/day (Well within free tier). **$0.00**

**Total Estimated Database Cost: < $5.00 / month.**

## 2. Gemini AI API Costs

The AI Coach and Business Idea generator use Gemini (Gemini 1.5 Flash).

- **Gemini 1.5 Flash (Free Tier)**: Up to 15 requests per minute, 1 million tokens per minute.
- **Usage for 1,000 users**: If each user makes 1 request/day, that's 1,000 requests/day.
- **Cost**: Currently free within limits. If you move to Pay-as-you-go, Flash is extremely cheap (~$0.10 per million tokens).

## 3. Recommended Infrastructure Upgrades

For 1,000 users, consider the following optimizations to keep costs low:

1.  **Pagination**: Currently, pages like `BusinessTransactionList` fetch up to 50 items. As data grows, ensure you use `startAfter` cursor pagination to avoid reading the entire history every time.
2.  **Indexing**: Ensure all queries have composite indexes to avoid performance bottlenecks.
3.  **Local Caching**: Implement `enableIndexedDbPersistence` in Firebase to reduce the number of reads from the server when users revisit the app.
4.  **Supabase Option**: If complex relational queries (joins) become necessary as you scale toward 10k+ users, the migration to Supabase (PostgreSQL) described in `DEPLOYMENT.md` is recommended.
