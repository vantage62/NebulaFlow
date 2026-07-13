import localforage from 'localforage';

export interface NotebookDocument {
  id: string;
  name: string;
  text: string;
  createdAt: number;
}

export type ArtifactType = 'summary' | 'notes' | 'flashcards' | 'quiz' | 'mindmap';

export interface NotebookArtifact {
  id: string;
  docId: string;
  type: ArtifactType;
  content: string; // Stored as a raw string (JSON for structured data like quizzes/flashcards)
  createdAt: number;
}

// Lazy initialization to completely avoid SSR crashes
let docStore: LocalForage;
let artifactStore: LocalForage;

function getDocStore() {
  if (!docStore) {
    docStore = localforage.createInstance({
      name: 'eastbound-notebook',
      storeName: 'documents',
    });
  }
  return docStore;
}

function getArtifactStore() {
  if (!artifactStore) {
    artifactStore = localforage.createInstance({
      name: 'eastbound-notebook',
      storeName: 'artifacts',
    });
  }
  return artifactStore;
}

// Document CRUD
export async function getDocuments(): Promise<NotebookDocument[]> {
  const docs: NotebookDocument[] = [];
  await getDocStore().iterate((value: NotebookDocument) => {
    docs.push(value);
  });
  return docs.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveDocument(doc: NotebookDocument): Promise<void> {
  await getDocStore().setItem(doc.id, doc);
}

export async function deleteDocument(id: string): Promise<void> {
  await getDocStore().removeItem(id);
  // Also delete associated artifacts
  const artifacts = await getArtifactsForDoc(id);
  for (const a of artifacts) {
    await deleteArtifact(a.id);
  }
}

// Artifact CRUD
export async function getArtifactsForDoc(docId: string): Promise<NotebookArtifact[]> {
  const artifacts: NotebookArtifact[] = [];
  await getArtifactStore().iterate((value: NotebookArtifact) => {
    if (value.docId === docId) {
      artifacts.push(value);
    }
  });
  return artifacts.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveArtifact(artifact: NotebookArtifact): Promise<void> {
  await getArtifactStore().setItem(artifact.id, artifact);
}

export async function deleteArtifact(id: string): Promise<void> {
  await getArtifactStore().removeItem(id);
}
