'use client';

import { useCallback, useEffect, useState } from 'react';
import ImageUpload from '@/components/ImageUpload';

const STORAGE_KEY = 'hb_admin_api_key';

interface BlogPostDto {
    id: number;
    title: string;
    slug: string;
    body: string;
    coverImageUrl: string | null;
    regionId: number | null;
    createdAt: string;
    updatedAt: string;
    latitude?: number;
    longitude?: number;
}

interface FormState {
    title: string;
    slug: string;
    body: string;
    coverImageUrl: string;
    regionHash: string;
    latitude: string;
    longitude: string;
}

const emptyForm: FormState = {
    title: '',
    slug: '',
    body: '',
    coverImageUrl: '',
    regionHash: '',
    latitude: '',
    longitude: '',
};

export default function AdminApp() {
    const [apiKey, setApiKey] = useState('');
    const [posts, setPosts] = useState<BlogPostDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<BlogPostDto | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPosts = useCallback(async (key = apiKey) => {
        if (!key) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/blog', {
                headers: { Authorization: `Bearer ${key}` },
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to load posts');
            }
            setPosts(json.posts as BlogPostDto[]);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [apiKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setApiKey(stored);
            void fetchPosts(stored);
        }
    }, [fetchPosts]);

    function handleSaveKey() {
        if (!apiKey) return;
        setIsSavingKey(true);
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, apiKey);
            }
            void fetchPosts(apiKey);
        } finally {
            setIsSavingKey(false);
        }
    }

    function resetForm() {
        setEditing(null);
        setForm(emptyForm);
    }

    function startCreate() {
        resetForm();
    }

    function startEdit(post: BlogPostDto) {
        setEditing(post);
        setForm({
            title: post.title,
            slug: post.slug,
            body: post.body,
            coverImageUrl: post.coverImageUrl ?? '',
            regionHash: '',
            latitude: post.latitude != null ? String(post.latitude) : '',
            longitude: post.longitude != null ? String(post.longitude) : '',
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!apiKey) {
            setError('API key is required');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload: Record<string, unknown> = {
                title: form.title,
                slug: form.slug || undefined,
                body: form.body,
                coverImageUrl: form.coverImageUrl || undefined,
            };
            if (form.regionHash) {
                payload.regionHash = form.regionHash;
            }

            if (form.latitude) {
                const lat = Number(form.latitude);
                if (!Number.isNaN(lat)) {
                    payload.latitude = lat;
                }
            }
            if (form.longitude) {
                const lng = Number(form.longitude);
                if (!Number.isNaN(lng)) {
                    payload.longitude = lng;
                }
            }

            const url = editing ? `/api/admin/blog/${editing.id}` : '/api/admin/blog';
            const method = editing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to save post');
            }

            await fetchPosts();
            resetForm();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save post');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(post: BlogPostDto) {
        if (!apiKey) {
            setError('API key is required');
            return;
        }
        if (!window.confirm('حذف این مطلب؟ این عمل قابل بازگشت نیست.')) return;
        setError(null);
        try {
            const res = await fetch(`/api/admin/blog/${post.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete post');
            }
            await fetchPosts();
            if (editing && editing.id === post.id) {
                resetForm();
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to delete post');
        }
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-8">
                <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-[2fr,3fr]">
                    <section className="bg-white rounded-lg shadow p-4 space-y-4">
                        <h1 className="text-xl font-semibold mb-2">HistoryBox Admin</h1>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full border rounded px-3 py-2 text-sm"
                                placeholder="Enter ADMIN_API_KEY"
                            />
                            <button
                                type="button"
                                onClick={handleSaveKey}
                                disabled={!apiKey || isSavingKey}
                                className="hb-btn-primary px-4 py-2 text-sm rounded disabled:opacity-50"
                            >
                                {isSavingKey ? 'در حال ذخیره…' : 'ذخیره و اتصال'}
                            </button>
                        </div>

                        <hr className="my-4" />

                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-semibold">ایجاد / ویرایش مطلب</h2>
                            <button
                                type="button"
                                onClick={startCreate}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                مطلب جدید
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                            <div>
                                <label className="block mb-1">عنوان</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                    className="w-full border rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Slug (اختیاری)</label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="مثال: history-of-tehran"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Cover Image URL (اختیاری)</label>
                                <input
                                    type="url"
                                    value={form.coverImageUrl}
                                    onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="https://..."
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    می‌توانید آدرس تصویر را اینجا وارد کنید یا در بخش زیر یک تصویر جدید آپلود کنید.
                                </p>
                            </div>
                            <div>
                                <label className="block mb-1">آپلود تصویر کاور</label>
                                <ImageUpload
                                    currentImage={form.coverImageUrl || undefined}
                                    onImageUpload={(url) => setForm((f) => ({ ...f, coverImageUrl: url }))}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Region Hash (اختیاری)</label>
                                <input
                                    type="text"
                                    value={form.regionHash}
                                    onChange={(e) => setForm((f) => ({ ...f, regionHash: e.target.value }))}
                                    className="w-full border rounded px-3 py-2"
                                    placeholder="کد منطقه مرتبط (hash یا geohash)"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block mb-1">Latitude (اختیاری)</label>
                                    <input
                                        type="text"
                                        value={form.latitude}
                                        onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="مثال: 35.6892"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-1">Longitude (اختیاری)</label>
                                    <input
                                        type="text"
                                        value={form.longitude}
                                        onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                                        className="w-full border rounded px-3 py-2"
                                        placeholder="مثال: 51.3890"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1">متن HTML / MDX</label>
                                <textarea
                                    value={form.body}
                                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                                    className="w-full border rounded px-3 py-2 h-40 font-mono text-xs"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="hb-btn-primary px-4 py-2 rounded disabled:opacity-50"
                                >
                                    {isSubmitting ? 'در حال ذخیره…' : editing ? 'به‌روزرسانی مطلب' : 'ایجاد مطلب'}
                                </button>
                                {editing && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-xs text-gray-500 hover:underline"
                                    >
                                        لغو ویرایش
                                    </button>
                                )}
                            </div>
                        </form>

                        {error && (
                            <p className="mt-3 text-xs text-red-600">{error}</p>
                        )}
                    </section>

                    <section className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold">لیست مطالب</h2>
                            <button
                                type="button"
                                onClick={() => fetchPosts()}
                                disabled={loading || !apiKey}
                                className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
                            >
                                بروزرسانی
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-xs text-gray-500">در حال بارگذاری…</p>
                        ) : posts.length === 0 ? (
                            <p className="text-xs text-gray-500">هنوز مطلبی ثبت نشده است.</p>
                        ) : (
                            <ul className="space-y-2 text-sm">
                                {posts.map((post) => (
                                    <li
                                        key={post.id}
                                        className="border rounded px-3 py-2 flex items-start justify-between gap-2"
                                    >
                                        <div>
                                            <div className="font-medium">{post.title}</div>
                                            <div className="text-xs text-gray-500 break-all">/blog/{post.slug}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">
                                                {new Date(post.createdAt).toLocaleString('fa-IR')}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(post)}
                                                className="text-xs text-indigo-600 hover:underline"
                                            >
                                                ویرایش
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleDelete(post)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        );
    }