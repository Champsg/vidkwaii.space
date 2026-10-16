import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import { getSiteSettings, saveSiteSettings } from '../lib/siteSettings';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, X, ExternalLink, Video } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(() => getSiteSettings().reviews);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sensitive' | 'beginners'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [votedHelpful, setVotedHelpful] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleSync = () => {
      setReviews(getSiteSettings().reviews);
    };
    window.addEventListener('vidkwaii_settings_updated', handleSync);
    return () => window.removeEventListener('vidkwaii_settings_updated', handleSync);
  }, []);

  // Review form state
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formSkinType, setFormSkinType] = useState('Sensitive Skin');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const toggleHelpful = (id: string) => {
    setVotedHelpful((prev) => {
      const isVoted = !!prev[id];
      setReviews((all) =>
        all.map((r) =>
          r.id === id ? { ...r, helpfulCount: r.helpfulCount + (isVoted ? -1 : 1) } : r
        )
      );
      return { ...prev, [id]: !isVoted };
    });
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formContent.trim()) return;
    if (isUploading) return;

    setIsUploading(true);

    try {
      let uploadedImageUrl: string | undefined = undefined;
      let uploadedVideoUrl: string | undefined = undefined;

      if (formFile) {
        const { supabase } = await import('../lib/supabase');
        
        // Generate a unique file name
        const fileExt = formFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        // Upload to a generic 'uploads' bucket (make sure this exists and has public read access)
        const { error } = await supabase.storage
          .from('uploads')
          .upload(filePath, formFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Error uploading file:', error);
          alert('Failed to upload file. ' + error.message);
          setIsUploading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;
        
        if (formFile.type.startsWith('video/')) {
          uploadedVideoUrl = publicUrl;
        } else {
          uploadedImageUrl = publicUrl;
        }
      }

      const newRev: Review = {
        id: `rev-${Date.now()}`,
        author: formName.trim(),
        avatarInitials: formName.slice(0, 2).toUpperCase(),
        rating: formRating,
        date: 'Just now',
        skinType: formSkinType,
        title: formTitle.trim() || 'My experience with Vidkwaii',
        content: formContent.trim(),
        verified: true,
        helpfulCount: 0,
        purchasedPack: 'Bestseller Duo Set (6-Pack)',
        imageUrl: uploadedImageUrl,
        videoUrl: uploadedVideoUrl,
      };

      const newReviews = [newRev, ...reviews];
      setReviews(newReviews);
      
      // Save reviews persistently
      const currentSettings = getSiteSettings();
      await saveSiteSettings({
        ...currentSettings,
        reviews: newReviews
      });

      setShowReviewModal(false);
      setFormName('');
      setFormTitle('');
      setFormContent('');
      setFormFile(null);
    } catch (error) {
      console.error('Error in handleAddReview:', error);
      alert('Something went wrong submitting your review.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredReviews = reviews
    .filter((r) => {
      // Safety guard against low star reviews killing conversions on paid ad traffic
      if (r.rating <= 2) return false;
      if (activeFilter === 'sensitive') {
        return r.skinType.toLowerCase().includes('sensitive');
      }
      if (activeFilter === 'beginners') {
        return (
          r.content.toLowerCase().includes('beginner') ||
          r.content.toLowerCase().includes('easy') ||
          r.content.toLowerCase().includes('unsteady')
        );
      }
      return true;
    })
    .sort((a, b) => b.rating - a.rating || (b.helpfulCount || 0) - (a.helpfulCount || 0));

  return (
    <section id="reviews" className="w-full bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs space-y-4">
      {/* Header and Aggregate Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-rose-700 tracking-wider uppercase">
            Community Love
          </span>
          <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
            Real Results from Verified Buyers
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-stone-900">4.9 / 5.0</span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-500">1,480+ Reviews</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowReviewModal(true)}
          className="self-start sm:self-auto text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4 text-stone-700" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-stone-100/70 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
            activeFilter === 'all'
              ? 'bg-white text-stone-900 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          All ({reviews.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('sensitive')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
            activeFilter === 'sensitive'
              ? 'bg-white text-stone-900 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Sensitive Skin
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('beginners')}
          className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
            activeFilter === 'beginners'
              ? 'bg-white text-stone-900 shadow-2xs font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          First-Timers
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-3 pt-1">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-2 transition-all"
          >
            {/* Header row: Author, Rating, Verified */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center">
                  {rev.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-900">{rev.author}</span>
                    {rev.verified && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-700 font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-600 fill-emerald-100" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-stone-400">
                    <span>{rev.skinType}</span>
                    <span>·</span>
                    <span>{rev.date}</span>
                  </div>
                </div>
              </div>

              {/* Stars */}
              <div className="flex text-amber-400">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>

            {/* Title & Content */}
            <h4 className="text-xs font-semibold text-stone-900">{rev.title}</h4>
            <p className="text-xs text-stone-600 leading-relaxed">{rev.content}</p>

            {/* Optional Attached Video */}
            {rev.videoUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-stone-200/80 w-full sm:max-w-[280px] bg-black">
                <video
                  src={rev.videoUrl}
                  poster={rev.imageUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-[280px] object-contain rounded-xl"
                />
              </div>
            )}

            {/* Optional Attached Image (if no video) */}
            {rev.imageUrl && !rev.videoUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-stone-200/80 w-full sm:max-w-[220px]">
                <img
                  src={rev.imageUrl}
                  alt="Review attachment"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-cover max-h-[260px]"
                />
              </div>
            )}

            {/* Optional Social / Post Link */}
            {rev.postUrl && (
              <div className="pt-0.5">
                <a
                  href={rev.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9B2C13] hover:text-[#80240F] bg-orange-50/90 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200/80 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View Original Post / Video</span>
                </a>
              </div>
            )}

            {/* Footer: Purchased pack & Helpful count */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-stone-400">
              <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200/60">
                Purchased: {rev.purchasedPack}
              </span>
              <button
                type="button"
                onClick={() => toggleHelpful(rev.id)}
                className={`flex items-center gap-1 text-[11px] py-1 px-2 rounded-md transition-colors cursor-pointer ${
                  votedHelpful[rev.id]
                    ? 'text-rose-600 font-semibold bg-rose-50'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Helpful ({rev.helpfulCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-stone-200 relative animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 w-8 h-8 flex items-center justify-center rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif font-bold text-lg text-stone-900 mb-1">
              Share Your Vidkwaii Experience
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Help other beauty shoppers with your honest thoughts.
            </p>

            <form onSubmit={handleAddReview} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Riya Verma"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Rating</label>
                  <select
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value={5}>5 Stars - Loved it!</option>
                    <option value={4}>4 Stars - Very good</option>
                    <option value={3}>3 Stars - Decent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Skin Type</label>
                  <select
                    value={formSkinType}
                    onChange={(e) => setFormSkinType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                  >
                    <option value="Sensitive Skin">Sensitive Skin</option>
                    <option value="Combination / Dry">Combination / Dry</option>
                    <option value="Oily / Normal">Oily / Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Headline</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. So easy to use and completely painless"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Review</label>
                <textarea
                  required
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Share how the razor felt on your brows or face, how smooth your makeup looks..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Photo or Video (Optional)</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFormFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2.5 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors cursor-pointer disabled:bg-stone-400 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading & Posting...' : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
