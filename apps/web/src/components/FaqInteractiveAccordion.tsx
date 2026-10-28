'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search,
  X,
  ChevronDown,
  Check,
  Link2,
  HelpCircle,
  MessageSquare,
  Layers,
  Wifi,
  Smartphone,
  RefreshCw,
  UtensilsCrossed,
  Coins,
  CreditCard,
} from 'lucide-react';

export { FALLBACK_FAQS, type FaqItem } from '../lib/faq-data';
import { FALLBACK_FAQS, type FaqItem } from '../lib/faq-data';

interface FaqInteractiveAccordionProps {
  initialItems: FaqItem[];
  locale: string;
}

export function FaqInteractiveAccordion({
  initialItems,
  locale,
}: FaqInteractiveAccordionProps) {
  const t = useTranslations('faqPage');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: 'all', label: t('allCategories'), icon: Layers },
      { id: 'shipping', label: t('categoryShipping'), icon: Wifi },
      { id: 'esim', label: t('categoryEsim'), icon: Smartphone },
      { id: 'refund', label: t('categoryRefund'), icon: RefreshCw },
      { id: 'dining', label: t('categoryDining'), icon: UtensilsCrossed },
      { id: 'currency', label: t('categoryCurrency'), icon: Coins },
      { id: 'payment', label: t('categoryPayment'), icon: CreditCard },
    ],
    [t]
  );

  // Deep linking: Inspect hash on mount to expand and scroll target item
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const matched = initialItems.find((item) => item.id === hash);
    if (matched) {
      setExpandedIds((prev) => new Set([...prev, matched.id]));
      if (matched.category !== selectedCategory && selectedCategory !== 'all') {
        setSelectedCategory('all');
      }
      setTimeout(() => {
        const el = document.getElementById(matched.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [initialItems, selectedCategory]);

  // Filter items by category and search text
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialItems.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCategory) return false;

      if (!q) return true;
      const questionText = item.question.toLowerCase();
      const answerText = item.answer.toLowerCase();
      const categoryText = item.category.toLowerCase();
      return (
        questionText.includes(q) ||
        answerText.includes(q) ||
        categoryText.includes(q)
      );
    });
  }, [initialItems, selectedCategory, searchQuery]);

  // Compute category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialItems.length };
    for (const item of initialItems) {
      const cat = item.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [initialItems]);

  const toggleItem = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(filteredItems.map((item) => item.id)));
  }, [filteredItems]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleCopyLink = useCallback(
    (id: string) => {
      if (typeof window === 'undefined') return;
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        window.history.replaceState(null, '', `#${id}`);
        setTimeout(() => setCopiedId(null), 2500);
      });
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  const allExpanded =
    filteredItems.length > 0 &&
    filteredItems.every((item) => expandedIds.has(item.id));

  return (
    <div className="space-y-8">
      {/* Search Input Bar (WS02, WS30 48px touch target) */}
      <div className="relative">
        <label htmlFor="faq-search" className="sr-only">
          {t('searchAriaLabel')}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-secondary">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="faq-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full min-h-12 h-12 pl-12 pr-12 rounded border border-paper-edge bg-surface text-primary placeholder-secondary text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t('clearSearch')}
              className="absolute right-0 top-0 bottom-0 w-12 h-12 min-w-12 min-h-12 flex items-center justify-center text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Category Pills Navigation (WS01, WS07, WS30 48px touch target) */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary block">
          {t('categoriesLabel')}
        </span>
        <div
          role="tablist"
          aria-label={t('categoriesLabel')}
          className="flex flex-wrap gap-2"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="faq-accordion-panel"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-12 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface text-secondary hover:text-primary hover:bg-paper border-paper-edge'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`tnum px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                    isSelected
                      ? 'bg-primary-container text-on-primary'
                      : 'bg-paper text-secondary'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Controls Bar: Results Count + Expand/Collapse All (WS06) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-paper-edge pb-4">
        <div className="text-xs font-mono text-secondary">
          <span className="tnum font-bold text-primary">{filteredItems.length}</span>{' '}
          <span>{t('resultsCount')}</span>
        </div>

        {filteredItems.length > 0 ? (
          <button
            type="button"
            onClick={allExpanded ? handleCollapseAll : handleExpandAll}
            className="min-h-12 px-4 py-2 rounded border border-paper-edge bg-surface hover:bg-paper text-primary text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary self-start sm:self-auto"
          >
            <span>{allExpanded ? t('collapseAll') : t('expandAll')}</span>
          </button>
        ) : null}
      </div>

      {/* Accordion Region (WS05, WS07, WS08, WS27, WS28, WS29) */}
      <div id="faq-accordion-panel" className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => {
            const isExpanded = expandedIds.has(item.id);
            const isCopied = copiedId === item.id;
            const triggerId = `faq-trigger-${item.id}`;
            const answerId = `faq-answer-${item.id}`;

            return (
              <article
                key={item.id || idx}
                id={item.id}
                className="rounded border border-paper-edge bg-surface transition-colors"
              >
                {/* Heading Outline (WS27) */}
                <h3 className="m-0 p-0 text-base font-bold">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isExpanded}
                      aria-controls={answerId}
                      onClick={() => toggleItem(item.id)}
                      className="w-full min-h-12 py-4 px-4 sm:px-6 flex items-center justify-between gap-4 text-left font-sans text-primary hover:bg-paper transition-colors rounded-l focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper border border-paper-edge text-secondary shrink-0">
                          {item.category.toUpperCase()}
                        </span>
                        <span className="text-base font-bold text-primary leading-snug">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-secondary shrink-0 transition-transform duration-transit motion-reduce:transition-none ${
                          isExpanded ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>

                    {/* Copy Direct Link Button (WS09, WS30 48px touch target) */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.id)}
                      aria-label={`${t('copyLink')}: ${item.question}`}
                      title={isCopied ? t('linkCopied') : t('copyLink')}
                      className="w-12 h-12 min-w-12 min-h-12 flex items-center justify-center border-l border-paper-edge text-secondary hover:text-primary hover:bg-paper transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 self-center"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </h3>

                {/* Answer Region (WS05, WS08, WS28) */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`border-t border-paper-edge p-5 sm:p-6 bg-paper ${
                    isExpanded ? 'block' : 'hidden'
                  }`}
                >
                  <p className="text-sm text-secondary font-normal leading-relaxed reading-prose break-words">
                    {item.answer}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          /* Empty / No-Results State (WS20, WS36, WS37) */
          <div
            role="status"
            className="p-8 sm:p-12 text-center rounded border border-dashed border-paper-edge bg-surface space-y-4"
          >
            <div className="w-12 h-12 rounded bg-paper border border-paper-edge flex items-center justify-center mx-auto text-secondary">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-display font-bold text-primary uppercase tracking-tight">
                {t('noResultsTitle')}
              </h4>
              <p className="text-sm text-secondary max-w-md mx-auto leading-relaxed reading-prose">
                {t('noResultsSubtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{t('clearFilter')}</span>
              </button>
              <Link
                href={`/${locale}/support`}
                className="min-h-12 px-6 rounded border border-paper-edge bg-surface hover:bg-paper text-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('contactSupport')}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
