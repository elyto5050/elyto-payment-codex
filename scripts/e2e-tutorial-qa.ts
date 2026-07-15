import { createTutorial, listTutorials, getTutorialBySlug, updateTutorial, deleteTutorial } from "../lib/services/tutorials";

async function run() {
  console.log('Starting tutorial E2E QA');

  const slug = 'how-elyto-gmail-verification-qa';
  const title = 'How Elyto Gmail Verification Works';
  const description = 'Learn how Elyto reads Gmail and verifies UPI payments.';
  const youtubeUrl = 'https://www.youtube.com/watch?v=xxxxxxxx';
  const thumbnailUrl = '/images/tutorials/how-elyto-gmail-verification-qa.jpg';
  const keywords = ['gmail', 'payment', 'verification', 'upi', 'worker'];

  // Create
  const created = await createTutorial({ title, description, youtubeUrl, thumbnailUrl, keywords, published: true, slug } as any);
  if (!created) {
    console.error('Failed to create tutorial');
    process.exit(1);
  }
  console.log('Tutorial Created:', created.slug || created.id);

  // Search checks
  const searches = ['gmail', 'payment', 'worker'];
  for (const q of searches) {
    const { data } = await listTutorials({ page: 1, pageSize: 50, search: q, admin: false });
    const found = (data || []).some((t: any) => (t.slug === (created.slug || created.id)));
    console.log(`Search '${q}':`, found ? 'Passed' : 'FAILED');
    if (!found) {
      console.error('Search failed for query:', q);
      process.exit(1);
    }
  }

  // Open tutorial
  const fetched = await getTutorialBySlug(slug, false as any);
  if (!fetched) {
    console.error('Failed to fetch tutorial by slug after creation');
    process.exit(1);
  }
  // Admin fetch (debug)
  const adminFetchedBefore = await getTutorialBySlug(slug, true as any);
  console.log('Admin fetched before unpublish:', adminFetchedBefore ? { id: adminFetchedBefore.id, published: adminFetchedBefore.published } : null);
  console.log('Fetched tutorial description present:', !!fetched.description ? 'Yes' : 'No');

  // Video embed extraction
  const m = (fetched.youtubeUrl || '').match(/(?:v=|be\/|embed\/)([A-Za-z0-9_-]{1,})/);
  const videoId = m ? m[1] : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  console.log('Video Loaded (embed url):', embedUrl ? embedUrl : 'No video id');

  // Thumbnail check (exists as string)
  console.log('Thumbnail present:', !!fetched.thumbnailUrl ? 'Yes' : 'No');

  // Disable (publish=false)
  const updated = await updateTutorial(created.id ?? created.slug ?? slug, { published: false } as any);
  console.log('Publish Toggle set to false');

  // Admin fetch after update (debug)
  const adminFetchedAfter = await getTutorialBySlug(slug, true as any);
  console.log('Admin fetched after unpublish:', adminFetchedAfter ? { id: adminFetchedAfter.id, published: adminFetchedAfter.published } : null);

  // Verify disappearance
  const { data: afterOff } = await listTutorials({ page: 1, pageSize: 50, search: 'gmail', admin: false });
  console.log('Public search results after unpublish (slugs):', (afterOff || []).map((x:any) => x.slug));
  const stillVisible = (afterOff || []).some((t: any) => (t.slug === (created.slug || created.id)));
  console.log('Publish Toggle Passed:', !stillVisible ? 'Yes' : 'FAILED');
  if (stillVisible) {
    console.error('Tutorial still visible after unpublish');
    process.exit(1);
  }

  // Delete
  const ok = await deleteTutorial(created.id ?? created.slug ?? slug);
  console.log('Delete attempted:', ok ? 'OK' : 'FAILED');

  const postDelete = await getTutorialBySlug(slug, false as any);
  console.log('Deleted tutorial not found:', postDelete ? 'FAILED' : 'Yes');
  if (postDelete) {
    console.error('Tutorial still exists after delete');
    process.exit(1);
  }

  console.log('E2E QA completed successfully');
}

run().catch((err) => {
  console.error('E2E QA failed', err);
  process.exit(1);
});
