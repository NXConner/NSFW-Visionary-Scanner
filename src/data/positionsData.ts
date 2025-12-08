/**
 * Comprehensive Positions Database
 * Includes all position categories: classic, tantric, oral variations, furniture-assisted, etc.
 */

export interface Position {
  id: string;
  name: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  instructions: string[];
  benefits: string[];
  tips: string[];
  tags: string[];
  stimulationType: string[];
  requiredFlexibility: 'low' | 'medium' | 'high';
  intimacyLevel: 'low' | 'medium' | 'high';
  images?: string[];
  videos?: string[];
  gifs?: string[];
  animations?: string[];
}

export const allPositions: Position[] = [
  // Classic Positions
  {
    id: 'missionary',
    name: 'Missionary',
    category: 'classic',
    difficulty: 'easy',
    description: 'The classic face-to-face position with one partner on top. Great for intimacy and eye contact.',
    instructions: [
      'Receiving partner lies on their back',
      'Giving partner positions themselves on top, between legs',
      'Weight supported on forearms or hands',
      'Maintain eye contact for connection',
      'Adjust angle by placing pillow under hips'
    ],
    benefits: [
      'Maximum skin-to-skin contact',
      'Easy access for kissing',
      'Good for emotional connection',
      'Allows for slow, intimate movements',
      'Comfortable for extended sessions'
    ],
    tips: [
      'Use a pillow under hips for better angles',
      'Wrap legs around partner for deeper connection',
      'Vary speed and depth for different sensations',
      'Incorporate hand movements and caressing'
    ],
    tags: ['intimate', 'beginner-friendly', 'romantic'],
    stimulationType: ['g-spot', 'clitoral proximity'],
    requiredFlexibility: 'low',
    intimacyLevel: 'high'
  },
  {
    id: 'cowgirl',
    name: 'Cowgirl',
    category: 'partner-on-top',
    difficulty: 'easy',
    description: 'Receiving partner on top, facing the other partner. Allows for control and varied movements.',
    instructions: [
      'One partner lies on their back',
      'Other partner straddles and sits on top',
      'Face toward partner\'s face',
      'Use knees and thighs to control movement',
      'Can lean forward or sit upright'
    ],
    benefits: [
      'Top partner controls depth and rhythm',
      'Great for clitoral stimulation',
      'Allows bottom partner to rest',
      'Visual appeal for both partners',
      'Easy access to torso for touching'
    ],
    tips: [
      'Lean forward for g-spot stimulation',
      'Sit upright for deeper penetration',
      'Grind instead of bounce for clitoral contact',
      'Bottom partner can thrust upward'
    ],
    tags: ['control', 'stimulating', 'visual'],
    stimulationType: ['g-spot', 'clitoral', 'a-spot'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  {
    id: 'doggy-style',
    name: 'Doggy Style',
    category: 'rear-entry',
    difficulty: 'easy',
    description: 'Classic rear-entry position on hands and knees. Allows for deep penetration.',
    instructions: [
      'Receiving partner on hands and knees',
      'Giving partner kneels behind',
      'Grip hips for control',
      'Adjust back arch for different angles',
      'Can lower to forearms for variation'
    ],
    benefits: [
      'Deep penetration',
      'G-spot stimulation from angle',
      'Hands free for additional stimulation',
      'Primal and exciting',
      'Multiple grip and angle options'
    ],
    tips: [
      'Arch back more for g-spot targeting',
      'Lower upper body to change angle',
      'Use hands on wall for stability',
      'Reach around for clitoral stimulation'
    ],
    tags: ['deep', 'exciting', 'versatile'],
    stimulationType: ['g-spot', 'deep penetration'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  {
    id: 'spooning',
    name: 'Spooning',
    category: 'side-by-side',
    difficulty: 'easy',
    description: 'Both partners lying on sides, one behind the other. Intimate and comfortable.',
    instructions: [
      'Both partners lie on their sides',
      'Face the same direction (big spoon behind)',
      'Front partner lifts top leg slightly',
      'Entry from behind at relaxed angle',
      'Wrap arms around for closeness'
    ],
    benefits: [
      'Very intimate and romantic',
      'Comfortable for extended sessions',
      'Good for morning or sleepy intimacy',
      'Easy access for hand stimulation',
      'Low physical exertion'
    ],
    tips: [
      'Use pillow between knees for comfort',
      'Back partner whispers for intimacy',
      'Great position for manual stimulation',
      'Perfect for slow, romantic sessions'
    ],
    tags: ['intimate', 'comfortable', 'romantic', 'lazy'],
    stimulationType: ['gentle', 'clitoral access'],
    requiredFlexibility: 'low',
    intimacyLevel: 'high'
  },
  {
    id: 'reverse-cowgirl',
    name: 'Reverse Cowgirl',
    category: 'partner-on-top',
    difficulty: 'medium',
    description: 'Top partner faces away from bottom partner while straddling. Different angle and visual.',
    instructions: [
      'One partner lies on back',
      'Other partner straddles facing feet',
      'Lean forward with hands on legs for support',
      'Control movement with thighs',
      'Can alternate sitting up and leaning'
    ],
    benefits: [
      'Different angle of stimulation',
      'Visual appeal for bottom partner',
      'P-spot stimulation possibility',
      'Top partner has control',
      'Access to perineum for bottom'
    ],
    tips: [
      'Lean forward for comfort and angle',
      'Be careful not to bend penis uncomfortably',
      'Great view for bottom partner',
      'Can grip ankles for leverage'
    ],
    tags: ['visual', 'control', 'exciting'],
    stimulationType: ['p-spot', 'different angle'],
    requiredFlexibility: 'medium',
    intimacyLevel: 'medium'
  },
  {
    id: 'standing',
    name: 'Standing',
    category: 'standing',
    difficulty: 'medium',
    description: 'Both partners standing, face to face or from behind. Spontaneous and exciting.',
    instructions: [
      'Both partners stand face to face',
      'One partner lifts leg around other\'s waist',
      'Wall support helps with stability',
      'Can also do from behind with bent receiving partner',
      'Strength and balance important'
    ],
    benefits: [
      'Spontaneous and exciting',
      'Great for quickies',
      'Can be done almost anywhere',
      'Face to face for intimacy',
      'Primal and passionate'
    ],
    tips: [
      'Use wall for support',
      'Wear heels to equalize heights if needed',
      'One leg up against wall works well',
      'Shower-friendly with caution'
    ],
    tags: ['spontaneous', 'exciting', 'quickie'],
    stimulationType: ['varied', 'friction'],
    requiredFlexibility: 'medium',
    intimacyLevel: 'medium'
  },
  {
    id: 'lotus',
    name: 'Lotus',
    category: 'sitting',
    difficulty: 'medium',
    description: 'Both partners sitting, face to face, extremely intimate with full body contact.',
    instructions: [
      'One partner sits cross-legged',
      'Other partner sits in their lap facing them',
      'Wrap legs around their waist',
      'Arms around each other',
      'Rock together rather than thrust'
    ],
    benefits: [
      'Extremely intimate',
      'Maximum skin contact',
      'Face to face connection',
      'Synchronized breathing possible',
      'Tantric and spiritual'
    ],
    tips: [
      'Focus on rocking, not thrusting',
      'Great for tantric practice',
      'Use cushion under bottom partner',
      'Eye gazing enhances connection'
    ],
    tags: ['tantric', 'intimate', 'connected', 'spiritual'],
    stimulationType: ['clitoral grinding', 'emotional'],
    requiredFlexibility: 'medium',
    intimacyLevel: 'high'
  },
  {
    id: 'pretzel',
    name: 'Pretzel Dip',
    category: 'side-entry',
    difficulty: 'hard',
    description: 'Complex intertwined position allowing for deep penetration and eye contact.',
    instructions: [
      'Receiving partner lies on side',
      'Giving partner kneels straddling bottom leg',
      'Top leg wraps around giving partner\'s waist',
      'Creates intimate side-entry angle',
      'Faces can be close for kissing'
    ],
    benefits: [
      'Deep penetration with intimacy',
      'Eye contact maintained',
      'Unique sensation angle',
      'Access for hand stimulation',
      'Combining best of multiple positions'
    ],
    tips: [
      'Takes practice to get positioning right',
      'Pillows help with comfort',
      'Adjust leg angle for depth',
      'Great for extended sessions'
    ],
    tags: ['complex', 'deep', 'intimate'],
    stimulationType: ['g-spot', 'deep', 'clitoral access'],
    requiredFlexibility: 'high',
    intimacyLevel: 'high'
  },
  {
    id: 'wheelbarrow',
    name: 'Wheelbarrow',
    category: 'athletic',
    difficulty: 'expert',
    description: 'Athletic position where one partner supports the other\'s legs while standing.',
    instructions: [
      'Receiving partner starts on all fours',
      'Giving partner lifts their legs',
      'Receiving partner supports with hands on floor',
      'Giving partner holds legs at waist level',
      'Requires strength from both partners'
    ],
    benefits: [
      'Deep, intense penetration',
      'Exciting and adventurous',
      'Good workout',
      'Very stimulating angle',
      'Sense of adventure'
    ],
    tips: [
      'Start from kneeling, then lift',
      'Receiving partner needs arm strength',
      'Short sessions recommended',
      'Place cushion under hands'
    ],
    tags: ['athletic', 'adventurous', 'challenging'],
    stimulationType: ['deep', 'intense'],
    requiredFlexibility: 'high',
    intimacyLevel: 'low'
  },
  {
    id: '69',
    name: '69',
    category: 'oral',
    difficulty: 'medium',
    description: 'Simultaneous oral stimulation position with partners head to toe.',
    instructions: [
      'Partners lie head to toe',
      'Can be side by side or one on top',
      'Each partner provides oral to the other',
      'Coordinate rhythm and pressure',
      'Communication important'
    ],
    benefits: [
      'Mutual pleasure simultaneously',
      'Equal giving and receiving',
      'Intimate and connected',
      'No penetration required',
      'Great foreplay or main event'
    ],
    tips: [
      'Side by side is more comfortable',
      'Lighter partner on top if stacking',
      'Use pillows for neck support',
      'Don\'t neglect partner while receiving'
    ],
    tags: ['oral', 'mutual', 'foreplay'],
    stimulationType: ['oral', 'mutual'],
    requiredFlexibility: 'low',
    intimacyLevel: 'high'
  },
  // Tantric Positions
  {
    id: 'yab-yum',
    name: 'Yab-Yum',
    category: 'tantric',
    difficulty: 'medium',
    description: 'Sacred tantric position with partners sitting face-to-face, creating deep spiritual and physical connection.',
    instructions: [
      'Both partners sit cross-legged',
      'One partner sits in the other\'s lap',
      'Wrap legs around partner\'s waist',
      'Maintain eye contact and synchronized breathing',
      'Focus on energy exchange and presence'
    ],
    benefits: [
      'Deep spiritual connection',
      'Maximum energy exchange',
      'Intense intimacy',
      'Synchronized breathing',
      'Tantric practice foundation'
    ],
    tips: [
      'Practice meditation together first',
      'Focus on presence, not performance',
      'Use cushions for comfort',
      'Maintain eye contact',
      'Breathe together slowly'
    ],
    tags: ['tantric', 'spiritual', 'intimate', 'meditative'],
    stimulationType: ['emotional', 'energetic', 'clitoral grinding'],
    requiredFlexibility: 'medium',
    intimacyLevel: 'high'
  },
  {
    id: 'tantric-69',
    name: 'Tantric 69',
    category: 'tantric',
    difficulty: 'hard',
    description: 'Tantric variation of 69 with focus on slow, mindful oral stimulation and energy exchange.',
    instructions: [
      'Partners lie side by side',
      'Position heads at each other\'s genitals',
      'Begin with slow, mindful touches',
      'Focus on giving and receiving equally',
      'Maintain awareness and presence'
    ],
    benefits: [
      'Mutual pleasure with mindfulness',
      'Deep energetic connection',
      'Equal giving and receiving',
      'Tantric practice',
      'Extended pleasure sessions'
    ],
    tips: [
      'Start slowly and build gradually',
      'Focus on presence, not orgasm',
      'Use pillows for comfort',
      'Communicate throughout',
      'Practice breath synchronization'
    ],
    tags: ['tantric', 'oral', 'mutual', 'mindful'],
    stimulationType: ['oral', 'energetic'],
    requiredFlexibility: 'medium',
    intimacyLevel: 'high'
  },
  {
    id: 'tantric-spooning',
    name: 'Tantric Spooning',
    category: 'tantric',
    difficulty: 'easy',
    description: 'Mindful variation of spooning with focus on energy exchange and presence.',
    instructions: [
      'Both partners lie on sides',
      'Back partner enters from behind',
      'Focus on slow, mindful movements',
      'Synchronize breathing',
      'Maintain awareness and connection'
    ],
    benefits: [
      'Comfortable for extended sessions',
      'Deep energetic connection',
      'Tantric practice',
      'Intimate and romantic',
      'Low physical exertion'
    ],
    tips: [
      'Focus on presence, not performance',
      'Synchronize breathing',
      'Use pillows for comfort',
      'Maintain awareness throughout',
      'Great for tantric beginners'
    ],
    tags: ['tantric', 'comfortable', 'intimate', 'mindful'],
    stimulationType: ['gentle', 'energetic'],
    requiredFlexibility: 'low',
    intimacyLevel: 'high'
  },
  // Oral Variations
  {
    id: 'deep-throat',
    name: 'Deep Throat',
    category: 'oral-variations',
    difficulty: 'hard',
    description: 'Advanced oral technique with deep penetration. Requires practice and communication.',
    instructions: [
      'Receiving partner lies on back or sits',
      'Giving partner positions at head level',
      'Start with shallow movements',
      'Gradually increase depth as comfortable',
      'Use breathing techniques and relaxation'
    ],
    benefits: [
      'Intense stimulation',
      'Advanced technique',
      'Visual appeal',
      'Deep connection',
      'Variety in oral play'
    ],
    tips: [
      'Communication is essential',
      'Start slowly and build up',
      'Use breathing techniques',
      'Relax throat muscles',
      'Stop if uncomfortable'
    ],
    tags: ['oral', 'advanced', 'intense'],
    stimulationType: ['oral', 'deep'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  {
    id: 'face-sitting',
    name: 'Face Sitting',
    category: 'oral-variations',
    difficulty: 'medium',
    description: 'Partner sits on face for oral stimulation. Allows for control and intensity variation.',
    instructions: [
      'Giving partner lies on back',
      'Receiving partner straddles face',
      'Receiving partner controls pressure and movement',
      'Can face forward or backward',
      'Use hands for support and balance'
    ],
    benefits: [
      'Receiving partner has control',
      'Intense stimulation possible',
      'Visual appeal',
      'Power dynamic play',
      'Hands free for other activities'
    ],
    tips: [
      'Use safe word or signal',
      'Start with light pressure',
      'Receiving partner controls pace',
      'Can alternate positions',
      'Great for power play dynamics'
    ],
    tags: ['oral', 'control', 'intense', 'power-play'],
    stimulationType: ['oral', 'clitoral'],
    requiredFlexibility: 'medium',
    intimacyLevel: 'medium'
  },
  {
    id: 'oral-standing',
    name: 'Standing Oral',
    category: 'oral-variations',
    difficulty: 'medium',
    description: 'Oral stimulation while standing. Spontaneous and exciting variation.',
    instructions: [
      'Receiving partner stands',
      'Giving partner kneels or sits on chair',
      'Use wall or furniture for support',
      'Can be done in various locations',
      'Height adjustment important'
    ],
    benefits: [
      'Spontaneous and exciting',
      'Can be done anywhere',
      'Visual appeal',
      'Power dynamic',
      'Quick and passionate'
    ],
    tips: [
      'Use furniture for height adjustment',
      'Receiving partner can lean against wall',
      'Great for quickies',
      'Shower-friendly',
      'Ensure stability'
    ],
    tags: ['oral', 'spontaneous', 'quickie', 'versatile'],
    stimulationType: ['oral'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  // Furniture-Assisted Positions
  {
    id: 'chair-ride',
    name: 'Chair Ride',
    category: 'furniture-assisted',
    difficulty: 'easy',
    description: 'One partner sits on chair while other straddles. Great for height differences and control.',
    instructions: [
      'One partner sits on sturdy chair',
      'Other partner straddles facing them',
      'Use chair arms for support',
      'Can lean forward or sit upright',
      'Chair provides stability and height'
    ],
    benefits: [
      'Solves height differences',
      'Stable and comfortable',
      'Good for extended sessions',
      'Easy access for touching',
      'Visual appeal'
    ],
    tips: [
      'Use sturdy, stable chair',
      'Place cushion on chair for comfort',
      'Can use chair back for leverage',
      'Great for kitchen or office play',
      'Ensure chair can support weight'
    ],
    tags: ['furniture', 'comfortable', 'versatile', 'height-difference'],
    stimulationType: ['g-spot', 'clitoral', 'varied'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  {
    id: 'couch-doggy',
    name: 'Couch Doggy',
    category: 'furniture-assisted',
    difficulty: 'easy',
    description: 'Classic doggy style with receiving partner bent over couch or bed. Comfortable and accessible.',
    instructions: [
      'Receiving partner bends over couch or bed',
      'Giving partner stands or kneels behind',
      'Use furniture for support and stability',
      'Can adjust height with cushions',
      'Hands free for additional stimulation'
    ],
    benefits: [
      'Comfortable for receiving partner',
      'Good height for giving partner',
      'Stable and secure',
      'Deep penetration possible',
      'Access for hand stimulation'
    ],
    tips: [
      'Use cushions to adjust height',
      'Receiving partner can grip furniture',
      'Great for extended sessions',
      'Can incorporate toys',
      'Works with various furniture heights'
    ],
    tags: ['furniture', 'comfortable', 'deep', 'versatile'],
    stimulationType: ['g-spot', 'deep penetration'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  {
    id: 'table-top',
    name: 'Table Top',
    category: 'furniture-assisted',
    difficulty: 'medium',
    description: 'Receiving partner lies on table while giving partner stands. Great height and angle.',
    instructions: [
      'Receiving partner lies on sturdy table',
      'Giving partner stands between legs',
      'Use table edge for leverage',
      'Can adjust height with cushions',
      'Table provides perfect height'
    ],
    benefits: [
      'Perfect height alignment',
      'Comfortable for both partners',
      'Good for eye contact',
      'Stable surface',
      'Easy to adjust angles'
    ],
    tips: [
      'Ensure table is sturdy',
      'Use cushions for comfort',
      'Can use table edge for leverage',
      'Great for kitchen or dining room',
      'Check weight capacity'
    ],
    tags: ['furniture', 'height-alignment', 'comfortable', 'versatile'],
    stimulationType: ['g-spot', 'varied angles'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  },
  {
    id: 'bed-edge',
    name: 'Bed Edge',
    category: 'furniture-assisted',
    difficulty: 'easy',
    description: 'Receiving partner on bed edge while giving partner stands. Perfect height and access.',
    instructions: [
      'Receiving partner lies on bed edge',
      'Legs hang over edge or wrap around partner',
      'Giving partner stands between legs',
      'Use bed for support and leverage',
      'Can adjust with pillows'
    ],
    benefits: [
      'Perfect height alignment',
      'Comfortable for receiving partner',
      'Good for eye contact',
      'Stable and secure',
      'Easy access for both partners'
    ],
    tips: [
      'Use pillows to adjust height',
      'Receiving partner can grip bed',
      'Great for extended sessions',
      'Can incorporate toys',
      'Works with various bed heights'
    ],
    tags: ['furniture', 'comfortable', 'height-alignment', 'versatile'],
    stimulationType: ['g-spot', 'clitoral', 'varied'],
    requiredFlexibility: 'low',
    intimacyLevel: 'medium'
  }
];

