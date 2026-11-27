import type { Profile } from './types';

const email = 'chvbswami@gmail.com';
const phone = { display: '+91 63041 14599', e164: '+916304114599' };
const resumePath = '/resume/Veerabhadra-Swami-Challagali-Resume.pdf';
const github = 'https://github.com/vbs-0';

export const profile: Profile = {
  name: 'Veerabhadra Swami Challagali',
  handle: 'vbs',
  role: 'Software Engineer',
  focus: 'AI/ML',
  location: 'India',
  thesis: 'Full-stack, taken literally.',
  thesisBody:
    'I work on every layer of a product that ships: the Android build under it, the protocol that crosses the air, the ledger behind the API, the app on the glass and the model that decides.',
  about: [
    'I am a software engineer at SkyLinx, where I am one of two team leads on a nine-person team building Emplinx, a multi-tenant HRMS on Django with an Android app. I graduated in artificial intelligence and machine learning in 2026, after a diploma in electrical and electronics engineering.',
    'Outside work I build things end to end and measure them: a fee ledger that proves every balance three ways, a household finance register evaluated on 500,000 synthetic transactions, a post-quantum chat prototype, and the Android device tree for a Redmi 13C 5G.',
    'I write down what a thing does, how I checked it, and where it stops working.',
  ],
  email,
  phone,
  resumePath,
  github,
  contacts: [
    { kind: 'email', label: 'Email', value: email, href: `mailto:${email}` },
    { kind: 'phone', label: 'Phone', value: phone.display, href: `tel:${phone.e164}` },
    { kind: 'github', label: 'GitHub', value: 'github.com/vbs-0', href: github },
    { kind: 'telegram', label: 'Telegram', value: '@vbs_0', href: 'https://t.me/vbs_0' },
    { kind: 'resume', label: 'Résumé', value: 'PDF, 2 pages', href: resumePath },
  ],
};
