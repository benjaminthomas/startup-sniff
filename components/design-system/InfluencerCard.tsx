import React from 'react';
import { Instagram, Facebook, Twitter } from 'lucide-react';

/**
 * Influencer Card Component
 * Based on the influencer marketing dashboard design
 */

export interface InfluencerCardProps {
  influencer: {
    id: string;
    name: string;
    avatar: string;
    followers: number;
    socials: Array<'instagram' | 'facebook' | 'twitter'>;
  };
  onAddToCampaign?: (influencerId: string) => void;
}

export function InfluencerCard({ influencer, onAddToCampaign }: InfluencerCardProps) {
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(2).replace(/\.?0+$/, '')}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.?0+$/, '')}K`;
    }
    return count.toString();
  };

  const getSocialIcon = (platform: 'instagram' | 'facebook' | 'twitter') => {
    const iconProps = {
      size: 16,
      className: 'transition-colors'
    };

    switch (platform) {
      case 'instagram':
        return <Instagram {...iconProps} className="text-[#E4405F] hover:opacity-80" />;
      case 'facebook':
        return <Facebook {...iconProps} className="text-[#1877F2] hover:opacity-80" />;
      case 'twitter':
        return <Twitter {...iconProps} className="text-[#1DA1F2] hover:opacity-80" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Avatar */}
      <img
        src={influencer.avatar}
        alt={influencer.name}
        className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-100"
      />

      {/* Name */}
      <h3 className="text-sm font-semibold text-neutral-900">
        {influencer.name}
      </h3>

      {/* Followers Count */}
      <p className="text-xs text-neutral-500">
        {formatFollowers(influencer.followers)} follower{influencer.followers !== 1 ? 's' : ''}
      </p>

      {/* Social Icons */}
      <div className="flex gap-2 items-center">
        {influencer.socials.map((social) => (
          <div
            key={social}
            className="w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            {getSocialIcon(social)}
          </div>
        ))}
      </div>

      {/* Add to Campaign Button */}
      <button
        onClick={() => onAddToCampaign?.(influencer.id)}
        className="w-full bg-[#2D6EF7] hover:bg-[#1E5EE8] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-[0_4px_12px_rgba(45,110,247,0.3)] hover:-translate-y-0.5"
      >
        Add to Campaign
      </button>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <InfluencerCard
 *   influencer={{
 *     id: '1',
 *     name: 'Noah Verentino',
 *     avatar: '/avatars/noah.jpg',
 *     followers: 2890080,
 *     socials: ['instagram', 'facebook', 'twitter']
 *   }}
 *   onAddToCampaign={(id) => console.log('Added influencer:', id)}
 * />
 */
