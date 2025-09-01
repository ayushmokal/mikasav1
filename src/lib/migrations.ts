import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Migrates any users stored under random document IDs to documents named by their UID: users/{uid}
// Returns counts of migrated and skipped documents.
export const migrateUsersToUidDocs = async (): Promise<{ migrated: number; skipped: number }> => {
  const snap = await getDocs(collection(db, 'users'))
  let migrated = 0
  let skipped = 0

  for (const d of snap.docs) {
    const data: any = d.data()
    const uid: string | undefined = data?.uid
    if (!uid) {
      skipped++
      continue
    }
    // If already in the correct place, skip
    if (d.id === uid) {
      skipped++
      continue
    }

    try {
      const targetRef = doc(db, 'users', uid)
      const target = await getDoc(targetRef)
      if (!target.exists()) {
        // Write the document to the canonical location
        await setDoc(targetRef, {
          ...data,
          uid,
          migratedFromId: d.id,
          updatedAt: Timestamp.now(),
        })
      }
      // Delete the old one to avoid duplication
      await deleteDoc(d.ref)
      migrated++
    } catch (err) {
      console.error('User migration failed for', d.id, err)
      skipped++
    }
  }

  console.info(`[Migration] users -> users/{uid}: migrated=${migrated} skipped=${skipped}`)
  return { migrated, skipped }
}

