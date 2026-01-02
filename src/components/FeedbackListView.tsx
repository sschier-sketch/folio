import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Feedback {
  id: string;
  user_id: string;
  feedback_text: string;
  willing_to_pay: boolean;
  payment_amount: string | null;
  status: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'up' | 'down' | null;
}

type FilterType = 'all' | 'top' | 'new' | 'mine';

export default function FeedbackListView() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [newFeedback, setNewFeedback] = useState('');
  const [willingToPay, setWillingToPay] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadFeedback();
  }, [filter, user]);

  const loadFeedback = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('user_feedback')
        .select('*');

      if (filter === 'mine') {
        query = query.eq('user_id', user.id);
      }

      if (filter === 'top') {
        query = query.order('upvotes', { ascending: false });
      } else if (filter === 'new') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('upvotes', { ascending: false });
      }

      const { data: feedbackData, error: feedbackError } = await query;

      if (feedbackError) throw feedbackError;

      const { data: votesData, error: votesError } = await supabase
        .from('feedback_votes')
        .select('feedback_id, vote_type')
        .eq('user_id', user.id);

      if (votesError) throw votesError;

      const votesMap = new Map(votesData?.map(v => [v.feedback_id, v.vote_type]) || []);

      const feedbackWithVotes = feedbackData?.map(fb => ({
        ...fb,
        user_vote: votesMap.get(fb.id) || null
      })) || [];

      setFeedbackList(feedbackWithVotes);
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId: string, voteType: 'up' | 'down') => {
    if (!user) return;

    try {
      const currentVote = feedbackList.find(f => f.id === feedbackId)?.user_vote;

      if (currentVote === voteType) {
        await supabase
          .from('feedback_votes')
          .delete()
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);
      } else if (currentVote) {
        await supabase
          .from('feedback_votes')
          .update({ vote_type: voteType })
          .eq('feedback_id', feedbackId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('feedback_votes')
          .insert({
            feedback_id: feedbackId,
            user_id: user.id,
            vote_type: voteType
          });
      }

      await loadFeedback();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedback.trim()) return;

    setSubmitting(true);
    setSuccessMessage('');
    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          feedback_text: newFeedback.trim(),
          willing_to_pay: willingToPay,
          payment_amount: willingToPay && paymentAmount ? paymentAmount : null,
          status: 'pending'
        });

      if (error) throw error;

      setNewFeedback('');
      setWillingToPay(false);
      setPaymentAmount('');
      setSuccessMessage(t('settings.feedback.success'));
      await loadFeedback();

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'text-emerald-600 bg-emerald-50';
      case 'planned': return 'text-primary-blue bg-primary-blue/5';
      case 'reviewed': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-400 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    return t(`settings.feedback.status.${status}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark mb-2">{t('feedback.title')}</h1>
        <p className="text-gray-400">{t('feedback.description')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-dark mb-4">{t('feedback.submit')}</h2>

        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('settings.feedback.idea')}
            </label>
            <textarea
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              rows={4}
              placeholder={t('settings.feedback.idea.placeholder')}
              required
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={willingToPay}
                onChange={(e) => setWillingToPay(e.target.checked)}
                className="w-5 h-5 text-primary-blue rounded border-gray-200 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-400">
                {t('settings.feedback.willing_to_pay')}
              </span>
            </label>

            {willingToPay && (
              <input
                type="text"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={t('settings.feedback.amount.placeholder')}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !newFeedback.trim()}
            className="w-full py-3 bg-primary-blue text-white rounded-lg hover:bg-primary-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {submitting
              ? (language === 'de' ? 'Wird gesendet...' : 'Submitting...')
              : t('settings.feedback.submit')}
          </button>
        </form>
      </div>

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-blue text-white'
              : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {t('feedback.filter.all')}
        </button>
        <button
          onClick={() => setFilter('top')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'top'
              ? 'bg-primary-blue text-white'
              : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {t('feedback.filter.top')}
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'new'
              ? 'bg-primary-blue text-white'
              : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {t('feedback.filter.new')}
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'mine'
              ? 'bg-primary-blue text-white'
              : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {t('feedback.filter.mine')}
        </button>
      </div>

      {feedbackList.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-xl font-semibold text-dark mb-2">
            {t('feedback.no_feedback')}
          </h3>
          <p className="text-gray-400">{t('feedback.submit_first')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((feedback) => (
            <div
              key={feedback.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleVote(feedback.id, 'up')}
                    className={`p-2 rounded-lg transition-colors ${
                      feedback.user_vote === 'up'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-dark">
                      {feedback.upvotes - feedback.downvotes}
                    </div>
                    <div className="text-xs text-gray-300">{t('feedback.votes')}</div>
                  </div>
                  <button
                    onClick={() => handleVote(feedback.id, 'down')}
                    className={`p-2 rounded-lg transition-colors ${
                      feedback.user_vote === 'down'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                        {getStatusText(feedback.status)}
                      </span>
                      <span className="text-sm text-gray-300">
                        {formatDate(feedback.created_at)}
                      </span>
                      {feedback.willing_to_pay && (
                        <span className="px-3 py-1 bg-primary-blue/5 text-primary-blue rounded-full text-xs font-medium">
                          {language === 'de' ? 'Zahlungsbereit' : 'Willing to Pay'}
                          {feedback.payment_amount && ` (${feedback.payment_amount})`}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-dark text-lg leading-relaxed whitespace-pre-wrap">
                    {feedback.feedback_text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
