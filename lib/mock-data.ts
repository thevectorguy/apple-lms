import type {
  User,
  Story,
  Lesson,
  LeaderboardEntry,
  Badge,
  LearningPath,
  Assessment,
  Trainer,
  Discussion,
  PeerChallenge,
  Achievement,
  Course,
  Episode,
  UserSkillProfile,
} from './types'

export const currentUser: User = {
  id: '1',
  name: 'Priya Sharma',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  level: 12,
  xp: 2450,
  xpToNextLevel: 3000,
  streak: 4,
  dailyGoalsStreakClaimed: false,
  totalLessonsCompleted: 45,
  badges: [
    { id: '1', name: 'First Steps', icon: '🎯', description: 'Complete your first lesson', locked: false, earnedAt: '2024-01-15' },
    { id: '2', name: 'Week Warrior', icon: '🔥', description: '7 day streak', locked: false, earnedAt: '2024-01-20' },
    { id: '3', name: 'iPhone Pro', icon: '📱', description: 'Master iPhone knowledge', locked: false, earnedAt: '2024-01-25' },
    { id: '4', name: 'Mac Expert', icon: '💻', description: 'Complete Mac training', locked: true },
    { id: '5', name: 'Sales Champion', icon: '🏆', description: 'Close 10 practice deals', locked: true },
    { id: '6', name: 'Quiz Master', icon: '🧠', description: 'Score 100% on 5 assessments', locked: true },
  ],
  dailyGoals: {
    timeSpent: 14,
    timeGoal: 30,
    lessonsCompleted: 2,
    lessonsGoal: 3,
    xpEarned: 150,
    xpGoal: 200,
  },
  rank: 23,
}

export const stories: Story[] = [
  { id: '1', instructor: { id: '1', name: 'Vikram', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', role: 'Senior Trainer', verified: true }, title: 'iPhone 16 Tips', thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&h=400&fit=crop', viewed: false, isNew: true },
  { id: '2', instructor: { id: '2', name: 'Ananya', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', role: 'Product Expert', verified: true }, title: 'MacBook M4', thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=400&fit=crop', viewed: false, isNew: true },
  { id: '3', instructor: { id: '3', name: 'Rahul', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', role: 'Sales Coach', verified: true }, title: 'Closing Tips', thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=400&fit=crop', viewed: true, isNew: false },
  { id: '4', instructor: { id: '4', name: 'Meera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', role: 'Tech Lead', verified: true }, title: 'iPad Pro', thumbnail: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=400&fit=crop', viewed: true, isNew: false },
  { id: '5', instructor: { id: '5', name: 'Arjun', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', role: 'Trainer', verified: false }, title: 'Apple Watch', thumbnail: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=400&fit=crop', viewed: true, isNew: false },
]

export const lessons: Lesson[] = [
  {
    id: '1',
    title: 'iPhone 16 Pro Max - Complete Overview',
    description: 'Master the new A18 Pro chip, Camera Control button, and all the game-changing features.',
    thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=800&fit=crop',
    duration: '2:45',
    xp: 50,
    instructor: { id: '1', name: 'Vikram Singh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', role: 'Senior Trainer', verified: true },
    phase: 'learn',
    category: 'iPhone',
    likes: 234,
    comments: 45,
    progress: 0,
    completed: false,
    locked: false,
  },
  {
    id: '2',
    title: 'Handling Price Objections Like a Pro',
    description: 'Learn proven techniques to address customer concerns about Apple pricing.',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=800&fit=crop',
    duration: '3:15',
    xp: 75,
    instructor: { id: '3', name: 'Rahul Verma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', role: 'Sales Coach', verified: true },
    phase: 'practice',
    category: 'Sales',
    likes: 512,
    comments: 89,
    progress: 65,
    completed: false,
    locked: false,
  },
  {
    id: '3',
    title: 'MacBook Air M4 - What You Need to Know',
    description: 'Explore the incredible performance and battery life of the new MacBook Air.',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=800&fit=crop',
    duration: '2:30',
    xp: 50,
    instructor: { id: '2', name: 'Ananya Patel', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', role: 'Product Expert', verified: true },
    phase: 'learn',
    category: 'Mac',
    likes: 189,
    comments: 34,
    progress: 100,
    completed: true,
    locked: false,
  },
  {
    id: '4',
    title: 'Apple Ecosystem - The Complete Picture',
    description: 'Understand how all Apple devices work together seamlessly.',
    thumbnail: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=600&h=800&fit=crop',
    duration: '4:00',
    xp: 100,
    instructor: { id: '4', name: 'Meera Nair', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', role: 'Tech Lead', verified: true },
    phase: 'discover',
    category: 'Ecosystem',
    likes: 756,
    comments: 123,
    progress: 0,
    completed: false,
    locked: false,
  },
  {
    id: '5',
    title: 'Advanced Sales Certification Challenge',
    description: 'Test your skills and earn the elite Sales Champion badge.',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=800&fit=crop',
    duration: '5:00',
    xp: 200,
    instructor: { id: '3', name: 'Rahul Verma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', role: 'Sales Coach', verified: true },
    phase: 'master',
    category: 'Certification',
    likes: 342,
    comments: 67,
    progress: 0,
    completed: false,
    locked: true,
  },
]

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, user: { id: '10', name: 'Aditya Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', level: 25 }, xp: 12500, streak: 45 },
  { rank: 2, user: { id: '11', name: 'Sneha Reddy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', level: 23 }, xp: 11200, streak: 32 },
  { rank: 3, user: { id: '12', name: 'Karthik M', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', level: 22 }, xp: 10800, streak: 28 },
  { rank: 4, user: { id: '13', name: 'Divya Sharma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', level: 21 }, xp: 10200, streak: 21 },
  { rank: 5, user: { id: '14', name: 'Rohan Gupta', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', level: 20 }, xp: 9800, streak: 19 },
  { rank: 6, user: { id: '15', name: 'Neha Singh', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', level: 19 }, xp: 9200, streak: 15 },
  { rank: 7, user: { id: '16', name: 'Amit Patel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', level: 18 }, xp: 8700, streak: 12 },
]

export const allBadges: Badge[] = [
  { id: '1', name: 'First Steps', icon: '🎯', description: 'Complete your first lesson', locked: false },
  { id: '2', name: 'Week Warrior', icon: '🔥', description: 'Maintain a 7-day streak', locked: false },
  { id: '3', name: 'iPhone Pro', icon: '📱', description: 'Master all iPhone modules', locked: false },
  { id: '4', name: 'Mac Expert', icon: '💻', description: 'Complete Mac training path', locked: true },
  { id: '5', name: 'Sales Champion', icon: '🏆', description: 'Close 10 practice deals', locked: true },
  { id: '6', name: 'Quiz Master', icon: '🧠', description: 'Score 100% on 5 assessments', locked: true },
  { id: '7', name: 'Speed Learner', icon: '⚡', description: 'Complete 5 lessons in one day', locked: true },
  { id: '8', name: 'Ecosystem Expert', icon: '🌐', description: 'Master all product categories', locked: true },
  { id: '9', name: 'Streak Legend', icon: '💎', description: 'Maintain a 30-day streak', locked: true },
  { id: '10', name: 'Top 10', icon: '🥇', description: 'Reach the Top 10 leaderboard', locked: true },
  { id: '11', name: 'Mentor', icon: '🎓', description: 'Help 5 peers with their learning', locked: true },
  { id: '12', name: 'Apple Certified', icon: '✨', description: 'Complete all certifications', locked: true },
]

export const sampleAssessment: Assessment = {
  id: '1',
  title: 'iPhone 16 Pro Knowledge Check',
  description: 'Test your knowledge of the new iPhone 16 Pro features',
  passingScore: 70,
  xpReward: 100,
  timeLimit: 300,
  badgeReward: { id: '3', name: 'iPhone Pro', icon: '📱', description: 'Master iPhone knowledge', locked: true },
  questions: [
    {
      id: '1',
      text: 'What chip powers the iPhone 16 Pro?',
      options: ['A17 Pro', 'A18 Pro', 'M2', 'A16 Bionic'],
      correctAnswer: 1,
      explanation: 'The iPhone 16 Pro is powered by the new A18 Pro chip, offering unprecedented performance and efficiency.',
    },
    {
      id: '2',
      text: 'What is the new button on iPhone 16 Pro called?',
      options: ['Action Button', 'Camera Control', 'Quick Capture', 'Focus Button'],
      correctAnswer: 1,
      explanation: 'The Camera Control is a new capacitive button that provides quick access to camera features.',
    },
    {
      id: '3',
      text: 'What is the display size of iPhone 16 Pro Max?',
      options: ['6.1 inches', '6.5 inches', '6.7 inches', '6.9 inches'],
      correctAnswer: 3,
      explanation: 'The iPhone 16 Pro Max features the largest display ever on an iPhone at 6.9 inches.',
    },
    {
      id: '4',
      text: 'What is the main camera resolution on iPhone 16 Pro?',
      options: ['12MP', '24MP', '48MP', '108MP'],
      correctAnswer: 2,
      explanation: 'iPhone 16 Pro features a 48MP main camera with advanced computational photography.',
    },
    {
      id: '5',
      text: 'Which feature allows seamless data transfer between Apple devices?',
      options: ['AirShare', 'AirDrop', 'QuickShare', 'DataSync'],
      correctAnswer: 1,
      explanation: 'AirDrop allows you to wirelessly share files between Apple devices instantly.',
    },
  ],
}

export const trainers: Trainer[] = [
  {
    id: '1',
    name: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'Senior Product Trainer',
    verified: true,
    followers: 1250,
    lessonsCount: 45,
    rating: 4.9,
    specialties: ['iPhone', 'iOS Features', 'Camera'],
    isFollowing: true,
  },
  {
    id: '2',
    name: 'Ananya Patel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'Mac Product Expert',
    verified: true,
    followers: 980,
    lessonsCount: 38,
    rating: 4.8,
    specialties: ['MacBook', 'macOS', 'Pro Apps'],
    isFollowing: false,
  },
  {
    id: '3',
    name: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'Sales Coach',
    verified: true,
    followers: 2100,
    lessonsCount: 62,
    rating: 4.9,
    specialties: ['Sales Techniques', 'Customer Handling', 'Objection Handling'],
    isFollowing: true,
  },
  {
    id: '4',
    name: 'Meera Nair',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    role: 'Ecosystem Specialist',
    verified: true,
    followers: 756,
    lessonsCount: 28,
    rating: 4.7,
    specialties: ['Apple Ecosystem', 'iPad', 'Apple Watch'],
    isFollowing: false,
  },
]

export const discussions: Discussion[] = [
  {
    id: '1',
    author: { id: '10', name: 'Aditya Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', level: 25 },
    content: 'Just closed my biggest iPhone 16 Pro Max deal! Customer was hesitant about the price, but the Camera Control demo sealed the deal. What features do you highlight first?',
    topic: 'Sales Tips',
    likes: 45,
    replies: 12,
    timestamp: '2h ago',
    isLiked: false,
  },
  {
    id: '2',
    author: { id: '11', name: 'Sneha Reddy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', level: 23 },
    content: 'Pro tip: When explaining Apple Intelligence, show the Writing Tools in Notes first. It is the easiest way to demonstrate AI capabilities!',
    topic: 'Product Knowledge',
    likes: 78,
    replies: 23,
    timestamp: '4h ago',
    isLiked: true,
  },
  {
    id: '3',
    author: { id: '12', name: 'Karthik M', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', level: 22 },
    content: 'Anyone else attending the MacBook M4 training next week? Would love to connect and discuss beforehand.',
    topic: 'Training',
    likes: 23,
    replies: 8,
    timestamp: '6h ago',
    isLiked: false,
  },
]

export const peerChallenges: PeerChallenge[] = [
  {
    id: '1',
    title: 'iPhone Feature Speed Quiz',
    description: 'Test your iPhone 16 knowledge in under 5 minutes. Beat your peers!',
    challenger: { id: '10', name: 'Aditya Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', level: 25 },
    xpReward: 150,
    deadline: '2 days left',
    participants: 45,
    category: 'iPhone',
    difficulty: 'medium',
    status: 'active',
  },
  {
    id: '2',
    title: 'Sales Pitch Showdown',
    description: 'Record your best 60-second MacBook pitch and get voted by peers.',
    challenger: { id: '3', name: 'Rahul Verma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', level: 22 },
    xpReward: 250,
    deadline: '5 days left',
    participants: 28,
    category: 'Sales',
    difficulty: 'hard',
    status: 'active',
  },
  {
    id: '3',
    title: 'Ecosystem Connection Quiz',
    description: 'Match Apple devices to their ecosystem features correctly.',
    challenger: { id: '4', name: 'Meera Nair', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', level: 19 },
    xpReward: 100,
    deadline: '1 day left',
    participants: 67,
    category: 'Ecosystem',
    difficulty: 'easy',
    status: 'active',
  },
]

export const sharedAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Sales Champion',
    description: 'Closed 10 practice deals',
    icon: '🏆',
    xp: 500,
    sharedBy: { id: '10', name: 'Aditya Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
    timestamp: '1h ago',
    likes: 34,
    comments: 8,
  },
  {
    id: '2',
    title: 'Streak Legend',
    description: 'Maintained a 30-day streak',
    icon: '💎',
    xp: 300,
    sharedBy: { id: '11', name: 'Sneha Reddy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
    timestamp: '3h ago',
    likes: 56,
    comments: 12,
  },
  {
    id: '3',
    title: 'iPhone Pro',
    description: 'Mastered all iPhone modules',
    icon: '📱',
    xp: 400,
    sharedBy: { id: '12', name: 'Karthik M', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
    timestamp: '5h ago',
    likes: 28,
    comments: 5,
  },
]

// Courses with Episodes
export const courses: Course[] = [
  {
    id: 'c1',
    title: 'iPhone 16 Pro Mastery',
    description: 'Complete guide to iPhone 16 Pro features and selling points',
    thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop',
    instructor: { id: '1', name: 'Vikram Singh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', role: 'Senior Trainer', verified: true },
    category: 'iPhone',
    level: 'Beginner',
    totalDuration: '1h 10m',
    xpReward: 500,
    progress: 66,
    status: 'in_progress',
    skillCategory: 'technical',
    certificateTitle: 'iPhone 16 Pro Specialist',
    completionBadge: { id: 'b-iphone', name: 'iPhone Pro', icon: '📱', description: 'Completed iPhone 16 Pro Mastery', locked: true },
    modules: [
      {
        id: 'mod-c1-1', title: 'Hardware Essentials', level: 1,
        episodes: [
          { id: 'e17', title: 'A18 Pro Chip Overview', description: 'Understanding the new chip architecture', duration: '3:20', thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false },
          { id: 'e18', title: 'Camera Control Deep Dive', description: 'Master the new camera button', duration: '4:15', thumbnail: 'https://images.unsplash.com/photo-1606041011872-596597976b25?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false },
          { id: 'e19', title: 'Pro Camera Workflows', description: 'Shoot, zoom, and switch modes faster in the field', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop', xp: 75, completed: true, locked: false },
          { id: 'e20', title: 'iOS 18 and Apple Intelligence', description: 'Everyday AI tools that save time', duration: '4:30', thumbnail: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=300&h=200&fit=crop', xp: 75, completed: true, locked: false },
        ],
        miniGames: [
          {
            afterEpisodeIndex: 1, game: {
              id: 'mg1', title: 'Chip & Camera Ninja!', gameType: 'fruit-ninja', questions: [
                { id: 'mgq1', text: 'What nm process does A18 Pro use?', options: ['3nm', '5nm', '7nm', '4nm'], correctAnswer: 0, explanation: 'A18 Pro uses TSMC 3nm.' },
                { id: 'mgq2', text: 'Camera Control is what type of button?', options: ['Physical', 'Capacitive', 'Virtual', 'Magnetic'], correctAnswer: 1, explanation: 'It is capacitive with haptic feedback.' },
                { id: 'mgq3', text: 'How many GPU cores in A18 Pro?', options: ['4', '5', '6', '8'], correctAnswer: 2, explanation: '6 GPU cores for enhanced graphics.' },
              ], xpReward: 75
            }
          },
        ],
        finalAssessment: {
          id: 'fa-c1-1', title: 'Hardware Essentials Assessment', description: 'Prove your knowledge of A18 Pro & Camera Control', questions: [
            { id: 'fq1', text: 'What is the A18 Pro process node?', options: ['3nm', '4nm', '5nm', '7nm'], correctAnswer: 0, explanation: 'A18 Pro uses 3nm process.' },
            { id: 'fq2', text: 'What gesture adjusts exposure on Camera Control?', options: ['Tap', 'Double-tap', 'Slide', 'Long press'], correctAnswer: 2, explanation: 'Sliding adjusts exposure.' },
            { id: 'fq3', text: 'Neural Engine delivers how many TOPS?', options: ['16', '24', '35', '45'], correctAnswer: 2, explanation: '35 trillion operations per second.' },
          ], passingScore: 70, xpReward: 100, timeLimit: 180
        },
        aiRoleplay: {
          id: 'air-c1-1',
          scenario: "Pitch the iPhone 16 Pro to a customer focused on gaming performance and Camera Control for content creation.",
          title: "Hardware Pitch",
          xpReward: 50
        },
        completed: true, locked: false,
      },
      {
        id: 'mod-c1-2', title: 'Display & Intelligence', level: 2,
        episodes: [
          { id: 'e21', title: 'Display Technology', description: 'ProMotion and Always-On Display', duration: '2:45', thumbnail: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&h=200&fit=crop', xp: 50, completed: false, locked: false },
          { id: 'e22', title: 'Battery and Thermal Management', description: 'Keeping performance efficient all day', duration: '3:40', thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=200&fit=crop', xp: 50, completed: false, locked: false },
          { id: 'e23', title: 'Apple Intelligence in Daily Use', description: 'Writing tools, summaries, and smart shortcuts', duration: '4:05', thumbnail: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=300&h=200&fit=crop', xp: 75, completed: false, locked: true },
          { id: 'e24', title: 'Camera and Display Optimization', description: 'Real-world settings for pro results', duration: '4:20', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop', xp: 75, completed: false, locked: true },
        ],
        miniGames: [
          {
            afterEpisodeIndex: 1, game: {
              id: 'mg2', title: 'AI Card Flip', gameType: 'card-flip', questions: [
                { id: 'mgq4', text: 'Max refresh rate of ProMotion?', options: ['60Hz', '90Hz', '120Hz', '144Hz'], correctAnswer: 2, explanation: '120Hz adaptive refresh.' },
                { id: 'mgq5', text: 'Where does Apple Intelligence process data first?', options: ['Cloud', 'On-device', 'Third-party', 'iCloud'], correctAnswer: 1, explanation: 'On-device first for privacy.' },
                { id: 'mgq6', text: 'Always-On Display min refresh rate?', options: ['1Hz', '5Hz', '10Hz', '15Hz'], correctAnswer: 0, explanation: '1Hz to save battery.' },
              ], xpReward: 100
            }
          },
        ],
        finalAssessment: {
          id: 'fa-c1-2', title: 'Display & Intelligence Assessment', description: 'Master display tech and Apple Intelligence', questions: [
            { id: 'fq4', text: 'What display technology is used?', options: ['LCD', 'OLED', 'Mini-LED', 'Micro-LED'], correctAnswer: 1, explanation: 'Super Retina XDR OLED.' },
            { id: 'fq5', text: 'Which app uses Writing Tools?', options: ['Mail only', 'Notes only', 'All text fields', 'Safari only'], correctAnswer: 2, explanation: 'All apps with text input.' },
            { id: 'fq6', text: 'What powers Genmoji creation?', options: ['App Store', 'Neural Engine', 'iCloud', 'Siri'], correctAnswer: 1, explanation: 'Neural Engine generates Genmoji.' },
          ], passingScore: 70, xpReward: 150, timeLimit: 180
        },
        aiRoleplay: {
          id: 'air-c1-2',
          scenario: "Explain the benefits of ProMotion and Apple Intelligence to a business professional.",
          title: "Intelligence Pitch",
          xpReward: 75
        },
        completed: false, locked: false,
      },
    ],
    episodes: [
      { id: 'e17', title: 'A18 Pro Chip Overview', description: 'Understanding the new chip architecture', duration: '3:20', thumbnail: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false, assessment: { id: 'a17', title: 'A18 Pro Chip Quiz', description: 'Test your chip knowledge', questions: [{ id: 'q1', text: 'What is the A18 Pro process node?', options: ['3nm', '4nm', '5nm', '7nm'], correctAnswer: 0, explanation: 'A18 Pro uses 3nm process for better efficiency.' }, { id: 'q2', text: 'How many GPU cores does A18 Pro have?', options: ['4 cores', '5 cores', '6 cores', '8 cores'], correctAnswer: 2, explanation: 'A18 Pro features 6 GPU cores for enhanced graphics.' }, { id: 'q3', text: 'What is the Neural Engine capability?', options: ['16 TOPS', '24 TOPS', '35 TOPS', '45 TOPS'], correctAnswer: 2, explanation: 'A18 Pro Neural Engine delivers 35 trillion operations per second.' }], passingScore: 70, xpReward: 50, timeLimit: 180 } },
      { id: 'e18', title: 'Camera Control Deep Dive', description: 'Master the new camera button', duration: '4:15', thumbnail: 'https://images.unsplash.com/photo-1606041011872-596597976b25?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false, assessment: { id: 'a18', title: 'Camera Control Quiz', description: 'Test your camera knowledge', questions: [{ id: 'q1', text: 'What type of button is Camera Control?', options: ['Physical', 'Capacitive', 'Virtual', 'Magnetic'], correctAnswer: 1, explanation: 'Camera Control is a capacitive button with haptic feedback.' }, { id: 'q2', text: 'What gesture adjusts exposure?', options: ['Tap', 'Double-tap', 'Slide', 'Long press'], correctAnswer: 2, explanation: 'Sliding on Camera Control adjusts exposure and depth of field.' }, { id: 'q3', text: 'Which mode does light press activate?', options: ['Video', 'Portrait', 'Photo', 'Quick settings'], correctAnswer: 3, explanation: 'A light press opens quick camera settings overlay.' }], passingScore: 70, xpReward: 50, timeLimit: 180 } },
      { id: 'e19', title: 'Pro Camera Workflows', description: 'Shoot, zoom, and switch modes faster in the field', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop', xp: 75, completed: true, locked: false, assessment: { id: 'a19', title: 'Pro Camera Workflow Quiz', description: 'Test your shooting workflow knowledge', questions: [{ id: 'q1', text: 'What setting speeds up quick captures?', options: ['Live Photo', 'Camera Control', 'Burst shortcuts', 'Macro only'], correctAnswer: 1, explanation: 'Camera Control helps speed up quick capture actions.' }, { id: 'q2', text: 'When should you use the telephoto lens?', options: ['Randomly', 'For distant subjects', 'Only selfies', 'Only indoors'], correctAnswer: 1, explanation: 'Telephoto is best for distant subjects and tighter framing.' }, { id: 'q3', text: 'What makes a workflow feel premium?', options: ['More taps', 'More menus', 'Fast mode switching', 'Lower resolution'], correctAnswer: 2, explanation: 'Fast mode switching feels smoother for the user.' }], passingScore: 70, xpReward: 75, timeLimit: 180 } },
      { id: 'e20', title: 'iOS 18 and Apple Intelligence', description: 'Everyday AI tools that save time', duration: '4:30', thumbnail: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=300&h=200&fit=crop', xp: 75, completed: true, locked: false, assessment: { id: 'a20', title: 'Apple Intelligence Workflow Quiz', description: 'Test your AI workflow knowledge', questions: [{ id: 'q1', text: 'What is the main privacy approach?', options: ['Cloud first', 'On-device first', 'Third-party first', 'Manual only'], correctAnswer: 1, explanation: 'Apple Intelligence prioritizes on-device processing first.' }, { id: 'q2', text: 'What can Writing Tools help with?', options: ['Editing and rewriting', 'Gaming', 'Charging', 'Bluetooth'], correctAnswer: 0, explanation: 'Writing Tools help edit, rewrite, and summarize text.' }, { id: 'q3', text: 'Why do AI features matter in sales?', options: ['More jargon', 'Better customer relevance', 'Less battery', 'More ads'], correctAnswer: 1, explanation: 'They help tailor the story to customer needs.' }], passingScore: 70, xpReward: 75, timeLimit: 180 } },
      { id: 'e21', title: 'Display Technology', description: 'ProMotion and Always-On Display', duration: '2:45', thumbnail: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=300&h=200&fit=crop', xp: 50, completed: false, locked: false, assessment: { id: 'a21', title: 'Display Technology Quiz', description: 'Test your display knowledge', questions: [{ id: 'q1', text: 'What is the max refresh rate?', options: ['60Hz', '90Hz', '120Hz', '144Hz'], correctAnswer: 2, explanation: 'ProMotion supports up to 120Hz adaptive refresh rate.' }, { id: 'q2', text: 'What is the minimum refresh rate for Always-On?', options: ['1Hz', '5Hz', '10Hz', '15Hz'], correctAnswer: 0, explanation: 'Always-On Display can drop to 1Hz to save battery.' }, { id: 'q3', text: 'What display technology is used?', options: ['LCD', 'OLED', 'Mini-LED', 'Micro-LED'], correctAnswer: 1, explanation: 'iPhone 16 Pro uses Super Retina XDR OLED display.' }], passingScore: 70, xpReward: 50, timeLimit: 180 } },
      { id: 'e22', title: 'Battery and Thermal Management', description: 'Keeping performance efficient all day', duration: '3:40', thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=200&fit=crop', xp: 50, completed: false, locked: false, assessment: { id: 'a22', title: 'Battery and Thermal Quiz', description: 'Test your efficiency knowledge', questions: [{ id: 'q1', text: 'What helps battery life most?', options: ['Higher brightness', 'Efficient chip design', 'More animations', 'Larger wallpapers'], correctAnswer: 1, explanation: 'Efficient hardware and software help battery life.' }, { id: 'q2', text: 'What feature helps manage heat?', options: ['Thermal throttling awareness', 'Case choice', 'More background apps', 'Extra charging'], correctAnswer: 0, explanation: 'Thermal management keeps performance balanced.' }, { id: 'q3', text: 'What is the user benefit of efficiency?', options: ['More lag', 'Longer use between charges', 'Lower screen size', 'Less storage'], correctAnswer: 1, explanation: 'Better efficiency means longer use between charges.' }], passingScore: 70, xpReward: 50, timeLimit: 180 } },
      { id: 'e23', title: 'Apple Intelligence in Daily Use', description: 'Writing tools, summaries, and smart shortcuts', duration: '4:05', thumbnail: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=300&h=200&fit=crop', xp: 75, completed: false, locked: true, assessment: { id: 'a23', title: 'Apple Intelligence Use Quiz', description: 'Test your AI workflow knowledge', questions: [{ id: 'q1', text: 'What does Apple Intelligence prioritize?', options: ['On-device processing', 'Random output', 'Cloud ads', 'Manual entry'], correctAnswer: 0, explanation: 'It prioritizes on-device processing for privacy.' }, { id: 'q2', text: 'What can summaries help with?', options: ['Saving time', 'Increasing clutter', 'Lowering clarity', 'Raising noise'], correctAnswer: 0, explanation: 'Summaries help users get through content faster.' }, { id: 'q3', text: 'Why is this useful in sales?', options: ['More jargon', 'More relevant conversations', 'Less empathy', 'Less context'], correctAnswer: 1, explanation: 'It helps keep conversations relevant to the buyer.' }], passingScore: 70, xpReward: 75, timeLimit: 180 } },
      { id: 'e24', title: 'Camera and Display Optimization', description: 'Real-world settings for pro results', duration: '4:20', thumbnail: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop', xp: 75, completed: false, locked: true, assessment: { id: 'a24', title: 'Camera and Display Tune-up Quiz', description: 'Test your finishing knowledge', questions: [{ id: 'q1', text: 'Which setting gives smoother motion?', options: ['60Hz', '90Hz', '120Hz', '30Hz'], correctAnswer: 2, explanation: '120Hz feels smoother for motion and scrolling.' }, { id: 'q2', text: 'What makes a camera workflow stronger?', options: ['Slow menus', 'Clear mode switching', 'Bigger icons', 'More taps'], correctAnswer: 1, explanation: 'Clear mode switching improves the workflow.' }, { id: 'q3', text: 'What matters most when selling this feature set?', options: ['Specs alone', 'Daily usefulness', 'Buzzwords', 'Random comparisons'], correctAnswer: 1, explanation: 'Customers respond to daily usefulness and outcomes.' }], passingScore: 70, xpReward: 75, timeLimit: 180 } },
    ],
  },
  {
    id: 'c2',
    title: 'Sales Excellence Program',
    description: 'Master the art of consultative selling for Apple products',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    instructor: { id: '3', name: 'Rahul Verma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', role: 'Sales Coach', verified: true },
    category: 'Sales',
    level: 'Intermediate',
    totalDuration: '1h 35m',
    xpReward: 750,
    progress: 25,
    status: 'in_progress',
    skillCategory: 'communication',
    certificateTitle: 'Sales Excellence Certified',
    completionBadge: { id: 'b-sales', name: 'Sales Champion', icon: '🏆', description: 'Completed Sales Excellence Program', locked: true },
    modules: [
      {
        id: 'mod-c2-1', title: 'Customer Discovery', level: 1,
        episodes: [
          { id: 'e25', title: 'Understanding Customer Needs', description: 'Discovery questions and active listening', duration: '4:30', thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop', xp: 75, completed: true, locked: false },
          { id: 'e26', title: 'Handling Price Objections', description: 'Value-based selling techniques', duration: '5:15', thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=200&fit=crop', xp: 100, completed: false, locked: false },
          { id: 'e27', title: 'Value Storytelling', description: 'Connect features to customer outcomes', duration: '4:20', thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
          { id: 'e28', title: 'Reading Buying Signals', description: 'Spot readiness before moving to demo', duration: '3:50', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
        ],
        miniGames: [
          {
            afterEpisodeIndex: 1, game: {
              id: 'mg3', title: 'Speed Sales Blitz!', gameType: 'speed-mcq', questions: [
                { id: 'mgq7', text: 'First step in consultative selling?', options: ['Present product', 'Ask questions', 'Quote price', 'Close deal'], correctAnswer: 1, explanation: 'Understand needs first.' },
                { id: 'mgq8', text: 'Best response to price objection?', options: ['Discount', 'Highlight value', 'Agree', 'Ignore'], correctAnswer: 1, explanation: 'Focus on value and ROI.' },
                { id: 'mgq9', text: 'What is active listening?', options: ['Waiting to talk', 'Notes only', 'Full attention + feedback', 'Many questions'], correctAnswer: 2, explanation: 'Full attention and feedback.' },
              ], xpReward: 100
            }
          },
        ],
        finalAssessment: {
          id: 'fa-c2-1', title: 'Customer Discovery Assessment', description: 'Prove your customer handling skills', questions: [
            { id: 'fq7', text: 'What type of questions uncover needs?', options: ['Closed', 'Open-ended', 'Leading', 'Yes/No'], correctAnswer: 1, explanation: 'Open-ended questions encourage sharing.' },
            { id: 'fq8', text: 'When should you discuss price?', options: ['Immediately', 'After establishing value', 'Never', 'Only if asked'], correctAnswer: 1, explanation: 'Establish value first.' },
            { id: 'fq9', text: 'What is "Feel, Felt, Found"?', options: ['Empathy method', 'Closing technique', 'Demo strategy', 'Pricing model'], correctAnswer: 0, explanation: 'Empathy-based objection handling.' },
          ], passingScore: 70, xpReward: 125, timeLimit: 180
        },
        completed: false, locked: false,
      },
      {
        id: 'mod-c2-2', title: 'Demos & Closing', level: 2,
        episodes: [
          { id: 'e29', title: 'Demo Best Practices', description: 'Creating memorable product demos', duration: '4:00', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop', xp: 75, completed: false, locked: true },
          { id: 'e30', title: 'Handling Live Demo Questions', description: 'Keep the flow when buyers interrupt', duration: '4:10', thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
          { id: 'e31', title: 'Trial Closes and Momentum', description: 'Check readiness without pressure', duration: '3:55', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
          { id: 'e32', title: 'Closing Techniques', description: 'Seal the deal confidently', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
        ],
        miniGames: [
          {
            afterEpisodeIndex: 1, game: {
              id: 'mg4', title: 'Demo & Close Card Flip', gameType: 'card-flip', questions: [
                { id: 'mgq10', text: 'Ideal demo length?', options: ['As long as needed', 'Under 2 min focused', '10+ min', '30 sec'], correctAnswer: 1, explanation: 'Short focused demos work best.' },
                { id: 'mgq11', text: 'What is an assumptive close?', options: ['Assume no buy', 'Act as if decided', 'Quick close', 'Heavy discount'], correctAnswer: 1, explanation: 'Move forward as if decided.' },
                { id: 'mgq12', text: 'When to close?', options: ['After long pitch', 'Buying signals appear', 'At start', 'Never'], correctAnswer: 1, explanation: 'Close on buying signals.' },
              ], xpReward: 125
            }
          },
        ],
        finalAssessment: {
          id: 'fa-c2-2', title: 'Demos & Closing Assessment', description: 'Master demo and closing skills', questions: [
            { id: 'fq10', text: 'What should you demo first?', options: ['All features', 'Features matching needs', 'Most expensive', 'Random'], correctAnswer: 1, explanation: 'Match customer needs.' },
            { id: 'fq11', text: 'How to handle demo failures?', options: ['Apologize', 'Stay calm, pivot', 'End demo', 'Blame device'], correctAnswer: 1, explanation: 'Stay calm and pivot.' },
            { id: 'fq12', text: 'What is a trial close?', options: ['Free trial', 'Test readiness', 'Competition', 'Practice run'], correctAnswer: 1, explanation: 'Tests customer readiness.' },
          ], passingScore: 70, xpReward: 150, timeLimit: 180
        },
        completed: false, locked: true,
      },
    ],
    episodes: [
      { id: 'e25', title: 'Understanding Customer Needs', description: 'Discovery questions and active listening', duration: '4:30', thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop', xp: 75, completed: true, locked: false, assessment: { id: 'a25', title: 'Customer Discovery Quiz', description: 'Test your discovery skills', questions: [{ id: 'q1', text: 'What is the first step in consultative selling?', options: ['Present product', 'Ask questions', 'Quote price', 'Close deal'], correctAnswer: 1, explanation: 'Understanding needs through questions is essential.' }, { id: 'q2', text: 'What type of questions uncover needs?', options: ['Closed', 'Open-ended', 'Leading', 'Yes/No'], correctAnswer: 1, explanation: 'Open-ended questions encourage customers to share more.' }, { id: 'q3', text: 'What is active listening?', options: ['Waiting to talk', 'Taking notes only', 'Full attention and feedback', 'Asking many questions'], correctAnswer: 2, explanation: 'Active listening means giving full attention and providing feedback.' }], passingScore: 70, xpReward: 75, timeLimit: 180 } },
      { id: 'e26', title: 'Handling Price Objections', description: 'Value-based selling techniques', duration: '5:15', thumbnail: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=300&h=200&fit=crop', xp: 100, completed: false, locked: false, assessment: { id: 'a26', title: 'Objection Handling Quiz', description: 'Test your objection skills', questions: [{ id: 'q1', text: 'Best response to "It is too expensive"?', options: ['Offer discount', 'Highlight value and ROI', 'Agree with them', 'Ignore objection'], correctAnswer: 1, explanation: 'Focus on value, not just price.' }, { id: 'q2', text: 'What is the "Feel, Felt, Found" technique?', options: ['Empathy method', 'Closing technique', 'Demo strategy', 'Pricing model'], correctAnswer: 0, explanation: 'This empathy method acknowledges feelings while sharing solutions.' }, { id: 'q3', text: 'When should you discuss price?', options: ['Immediately', 'After establishing value', 'Never', 'Only if asked'], correctAnswer: 1, explanation: 'Establish value before discussing price to justify investment.' }], passingScore: 70, xpReward: 100, timeLimit: 180 } },
      { id: 'e27', title: 'Value Storytelling', description: 'Connect features to customer outcomes', duration: '4:20', thumbnail: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true, assessment: { id: 'a27', title: 'Value Storytelling Quiz', description: 'Test your storytelling skills', questions: [{ id: 'q1', text: 'What should feature talk always lead to?', options: ['More jargon', 'Customer value', 'Longer pitch', 'More slides'], correctAnswer: 1, explanation: 'Translate features into customer outcomes.' }, { id: 'q2', text: 'What makes a story stick?', options: ['Relevance', 'Volume', 'Speed', 'Random facts'], correctAnswer: 0, explanation: 'Relevant stories are remembered better.' }, { id: 'q3', text: 'Why connect to outcomes?', options: ['To confuse buyers', 'To make the value clear', 'To extend meetings', 'To skip objections'], correctAnswer: 1, explanation: 'Outcome-based language makes the value easy to understand.' }], passingScore: 70, xpReward: 100, timeLimit: 180 } },
      { id: 'e28', title: 'Reading Buying Signals', description: 'Spot readiness before moving to demo', duration: '3:50', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true, assessment: { id: 'a28', title: 'Buying Signals Quiz', description: 'Test your readiness sense', questions: [{ id: 'q1', text: 'What is a buying signal?', options: ['Customer silence', 'Interest in next steps', 'Price hesitation', 'No questions'], correctAnswer: 1, explanation: 'Buying signals show the customer is leaning in.' }, { id: 'q2', text: 'What should you do when signals appear?', options: ['Change topic', 'Advance naturally', 'Restart demo', 'Increase pressure'], correctAnswer: 1, explanation: 'Move the conversation forward naturally.' }, { id: 'q3', text: 'What is a good demo trigger?', options: ['Random timing', 'Expressed interest in the product', 'Any pause', 'A discount request only'], correctAnswer: 1, explanation: 'Expressed interest is a good moment to demo.' }], passingScore: 70, xpReward: 100, timeLimit: 180 } },
      { id: 'e29', title: 'Demo Best Practices', description: 'Creating memorable product demos', duration: '4:00', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop', xp: 75, completed: false, locked: true, assessment: { id: 'a29', title: 'Demo Skills Quiz', description: 'Test your demo abilities', questions: [{ id: 'q1', text: 'How long should an ideal demo be?', options: ['As long as needed', 'Under 2 minutes focused', '10+ minutes detailed', '30 seconds quick'], correctAnswer: 1, explanation: 'Short, focused demos keep attention and highlight key benefits.' }, { id: 'q2', text: 'What should you demo first?', options: ['All features', 'Features matching needs', 'Most expensive features', 'Random features'], correctAnswer: 1, explanation: 'Demo features that directly address customer needs.' }, { id: 'q3', text: 'How to handle demo failures?', options: ['Apologize repeatedly', 'Stay calm, pivot smoothly', 'End the demo', 'Blame the device'], correctAnswer: 1, explanation: 'Stay calm and smoothly transition to another feature or device.' }], passingScore: 70, xpReward: 75, timeLimit: 180 } },
      { id: 'e30', title: 'Handling Live Demo Questions', description: 'Keep the flow when buyers interrupt', duration: '4:10', thumbnail: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true, assessment: { id: 'a30', title: 'Live Demo Recovery Quiz', description: 'Test your in-the-moment handling', questions: [{ id: 'q1', text: 'What is the best first move during a demo interruption?', options: ['Ignore it', 'Acknowledge and answer', 'Leave the call', 'Change product'], correctAnswer: 1, explanation: 'Acknowledge the question and keep momentum.' }, { id: 'q2', text: 'What keeps a demo calm?', options: ['Script rigidity', 'Prepared pivots', 'More jargon', 'Faster speech'], correctAnswer: 1, explanation: 'Prepared pivots help you respond smoothly.' }, { id: 'q3', text: 'What should you do after answering?', options: ['Restart from zero', 'Tie it back to value', 'End immediately', 'Avoid the topic'], correctAnswer: 1, explanation: 'Bring the answer back to the customer outcome.' }], passingScore: 70, xpReward: 100, timeLimit: 180 } },
      { id: 'e31', title: 'Trial Closes and Momentum', description: 'Check readiness without pressure', duration: '3:55', thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true, assessment: { id: 'a31', title: 'Trial Close Quiz', description: 'Test your momentum skills', questions: [{ id: 'q1', text: 'What does a trial close test?', options: ['Battery life', 'Readiness to move forward', 'Discount limits', 'Warranty length'], correctAnswer: 1, explanation: 'Trial closes check readiness without pressure.' }, { id: 'q2', text: 'When should you use a trial close?', options: ['Only at the start', 'When buying signals appear', 'Never', 'After the deal is dead'], correctAnswer: 1, explanation: 'Use it when the buyer seems engaged.' }, { id: 'q3', text: 'What should happen after a positive signal?', options: ['Stop talking', 'Advance to next step', 'Restart demo', 'Reduce clarity'], correctAnswer: 1, explanation: 'Move the sale forward naturally.' }], passingScore: 70, xpReward: 100, timeLimit: 180 } },
      { id: 'e32', title: 'Closing Techniques', description: 'Seal the deal confidently', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true, assessment: { id: 'a32', title: 'Closing Quiz', description: 'Test your closing skills', questions: [{ id: 'q1', text: 'What is an assumptive close?', options: ['Assuming they will not buy', 'Acting as if decision made', 'Quickly closing', 'Heavy discounting'], correctAnswer: 1, explanation: 'An assumptive close moves forward as if the decision is already made.' }, { id: 'q2', text: 'When is the best time to close?', options: ['After long pitch', 'When buying signals appear', 'At the start', 'Never ask to close'], correctAnswer: 1, explanation: 'Close when you observe positive buying signals from the customer.' }, { id: 'q3', text: 'What is a trial close?', options: ['Free trial offer', 'Test customer readiness', 'Closing competition', 'Practice run'], correctAnswer: 1, explanation: 'Trial closes test customer readiness without direct pressure.' }], passingScore: 70, xpReward: 100, timeLimit: 180 } },
    ],
  },
  {
    id: 'c3',
    title: 'MacBook M4 Training',
    description: 'Everything about the new MacBook lineup with M4 chips',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
    instructor: { id: '2', name: 'Ananya Patel', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', role: 'Product Expert', verified: true },
    category: 'Mac',
    level: 'Beginner',
    totalDuration: '35m',
    xpReward: 400,
    progress: 100,
    status: 'completed',
    skillCategory: 'technical',
    episodes: [
      { id: 'e9', title: 'M4 Chip Architecture', description: 'CPU, GPU, and Neural Engine', duration: '4:00', thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false },
      { id: 'e10', title: 'Battery & Performance', description: 'All-day battery and efficiency', duration: '3:30', thumbnail: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false },
      { id: 'e11', title: 'macOS Integration', description: 'Continuity and ecosystem features', duration: '3:00', thumbnail: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=200&fit=crop', xp: 50, completed: true, locked: false },
    ],
  },
  {
    id: 'c4',
    title: 'Leadership & Team Management',
    description: 'Develop leadership skills for retail team success',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
    instructor: { id: '3', name: 'Rahul Verma', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', role: 'Sales Coach', verified: true },
    category: 'Leadership',
    level: 'Advanced',
    totalDuration: '55m',
    xpReward: 600,
    progress: 0,
    status: 'not_started',
    skillCategory: 'leadership',
    episodes: [
      { id: 'e12', title: 'Setting Team Goals', description: 'OKRs and performance metrics', duration: '5:00', thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&h=200&fit=crop', xp: 100, completed: false, locked: false },
      { id: 'e13', title: 'Coaching & Feedback', description: 'Effective team development', duration: '4:30', thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
      { id: 'e14', title: 'Conflict Resolution', description: 'Handling team challenges', duration: '4:00', thumbnail: 'https://images.unsplash.com/photo-1573497491765-dccce02b29df?w=300&h=200&fit=crop', xp: 100, completed: false, locked: true },
    ],
  },
  {
    id: 'c5',
    title: 'Compliance & Ethics',
    description: 'Apple retail policies and ethical selling practices',
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=400&fit=crop',
    instructor: { id: '4', name: 'Meera Nair', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', role: 'Tech Lead', verified: true },
    category: 'Compliance',
    level: 'Beginner',
    totalDuration: '30m',
    xpReward: 300,
    progress: 0,
    status: 'not_started',
    skillCategory: 'compliance',
    episodes: [
      { id: 'e15', title: 'Data Privacy Basics', description: 'Customer data handling', duration: '3:30', thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=300&h=200&fit=crop', xp: 50, completed: false, locked: false },
      { id: 'e16', title: 'Ethical Sales Practices', description: 'Honest and transparent selling', duration: '4:00', thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop', xp: 50, completed: false, locked: true },
    ],
  },
]

// User Skill Profile based on completed assessments
export const userSkillProfile: UserSkillProfile = {
  radarData: {
    communication: 74,
    technical: 46,
    leadership: 68,
    compliance: 72,
  },
  readinessScore: 65,
  weakAreas: ['technical'],
  strongAreas: ['communication', 'compliance'],
  skillGapByCategory: {
    communication: 26,
    technical: 54,
    leadership: 32,
    compliance: 28,
  },
  competencyHistory: [
    {
      id: 'evt-seed-1',
      type: 'ai_practice',
      skillCategory: 'technical',
      score: 74,
      impactWeight: 0.45,
      sourceId: 'practice-technical-confidence',
      sourceTitle: 'Technical confidence practice',
      timestamp: '2026-03-20T10:30:00.000Z',
    },
    {
      id: 'evt-seed-2',
      type: 'assessment',
      skillCategory: 'technical',
      score: 63,
      impactWeight: 0.25,
      sourceId: 'fa-c1-1',
      sourceTitle: 'Hardware Essentials Assessment',
      timestamp: '2026-03-21T14:10:00.000Z',
    },
  ],
  speedFramework: {
    stages: {
      start_right: {
        score: 78,
        updatedAt: '2026-03-20T10:30:00.000Z',
        sourceTitle: 'Opening pitch practice',
        practiceMode: 'pitch',
      },
      plan_to_probe: {
        score: 71,
        updatedAt: '2026-03-19T16:00:00.000Z',
        sourceTitle: 'Discovery roleplay',
        practiceMode: 'guided_ai',
      },
      explain_value: {
        score: 82,
        updatedAt: '2026-03-20T10:30:00.000Z',
        sourceTitle: 'Technical confidence practice',
        practiceMode: 'pitch',
      },
      eliminate_objection: {
        score: 69,
        updatedAt: '2026-03-18T11:20:00.000Z',
        sourceTitle: 'Price objection roleplay',
        practiceMode: 'roleplay',
      },
      drive_closure: {
        score: 74,
        updatedAt: '2026-03-21T09:05:00.000Z',
        sourceTitle: 'Next-step closing drill',
        practiceMode: 'guided_ai',
      },
    },
  },
  nextStepPlan: null,
  recommendations: [
    'Practice with AI Coach to strengthen technical confidence in customer conversations',
    'Open iPhone 16 Pro Mastery and review the next unfinished lesson',
  ],
}

export const learningPaths: LearningPath[] = [
  {
    id: '1',
    title: 'iPhone Mastery',
    description: 'Become an iPhone expert from basics to advanced features',
    totalXP: 500,
    estimatedTime: '2 hours',
    progress: 45,
    phases: [
      {
        id: 'p1',
        name: 'Discover',
        icon: '🧠',
        completed: true,
        locked: false,
        lessons: [lessons[0]],
      },
      {
        id: 'p2',
        name: 'Learn',
        icon: '🎯',
        completed: false,
        locked: false,
        lessons: [lessons[1]],
        assessment: sampleAssessment,
      },
      {
        id: 'p3',
        name: 'Practice',
        icon: '⚡',
        completed: false,
        locked: true,
        lessons: [lessons[2]],
      },
      {
        id: 'p4',
        name: 'Master',
        icon: '🏆',
        completed: false,
        locked: true,
        lessons: [lessons[4]],
      },
    ],
  },
]
