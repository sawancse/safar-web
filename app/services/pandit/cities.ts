// City directory for Pandit / Puja SEO landing pages.
// Powers /services/pandit/city/[city] and the city-links block on the landing.

export type PanditCity = {
  slug: string;
  name: string;
  state: string;
  localities: string[]; // a few well-known areas, used in copy for local relevance
};

export const PANDIT_CITIES: PanditCity[] = [
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana',     localities: ['Gachibowli', 'Madhapur', 'Kondapur', 'Kukatpally', 'Banjara Hills'] },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka',     localities: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City'] },
  { slug: 'chennai',   name: 'Chennai',   state: 'Tamil Nadu',    localities: ['T. Nagar', 'Adyar', 'Velachery', 'Anna Nagar', 'OMR'] },
  { slug: 'mumbai',    name: 'Mumbai',    state: 'Maharashtra',   localities: ['Andheri', 'Bandra', 'Powai', 'Thane', 'Borivali'] },
  { slug: 'pune',      name: 'Pune',      state: 'Maharashtra',   localities: ['Kothrud', 'Hinjewadi', 'Wakad', 'Viman Nagar', 'Baner'] },
  { slug: 'delhi',     name: 'Delhi',     state: 'Delhi NCR',     localities: ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Janakpuri'] },
  { slug: 'gurugram',  name: 'Gurugram',  state: 'Haryana',       localities: ['DLF Phase 1-5', 'Sohna Road', 'Golf Course Road', 'Sector 56'] },
  { slug: 'noida',     name: 'Noida',     state: 'Uttar Pradesh', localities: ['Sector 62', 'Sector 137', 'Greater Noida', 'Sector 18'] },
  { slug: 'kolkata',   name: 'Kolkata',   state: 'West Bengal',   localities: ['Salt Lake', 'New Town', 'Behala', 'Howrah', 'Ballygunge'] },
  { slug: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat',       localities: ['Satellite', 'Bopal', 'Maninagar', 'Prahlad Nagar', 'SG Highway'] },
  { slug: 'jaipur',    name: 'Jaipur',    state: 'Rajasthan',     localities: ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'C-Scheme'] },
  { slug: 'lucknow',   name: 'Lucknow',   state: 'Uttar Pradesh', localities: ['Gomti Nagar', 'Hazratganj', 'Indira Nagar', 'Aliganj'] },
];

export function findCity(slug: string): PanditCity | undefined {
  return PANDIT_CITIES.find(c => c.slug === slug);
}
