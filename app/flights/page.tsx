'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDate } from '@/lib/utils';

const INDIAN_AIRPORTS = [
  // Metro
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi Intl' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Intl' },
  { code: 'BLR', city: 'Bangalore', name: 'Kempegowda Intl' },
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi Intl' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai Intl' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose Intl' },
  // Tier 1
  { code: 'GOI', city: 'Goa', name: 'Manohar Intl' },
  { code: 'COK', city: 'Kochi', name: 'Cochin Intl' },
  { code: 'JAI', city: 'Jaipur', name: 'Jaipur Intl' },
  { code: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl' },
  { code: 'PNQ', city: 'Pune', name: 'Pune Airport' },
  { code: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Intl' },
  { code: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi Intl' },
  { code: 'SXR', city: 'Srinagar', name: 'Sheikh Ul Alam Intl' },
  { code: 'IXC', city: 'Chandigarh', name: 'Chandigarh Intl' },
  { code: 'PAT', city: 'Patna', name: 'Jay Prakash Narayan Intl' },
  { code: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik Intl' },
  { code: 'NAG', city: 'Nagpur', name: 'Dr. Babasaheb Ambedkar Intl' },
  { code: 'VNS', city: 'Varanasi', name: 'Lal Bahadur Shastri Intl' },
  { code: 'IXB', city: 'Bagdogra', name: 'Bagdogra Airport' },
  { code: 'TRV', city: 'Thiruvananthapuram', name: 'Trivandrum Intl' },
  { code: 'VTZ', city: 'Visakhapatnam', name: 'Visakhapatnam Airport' },
  { code: 'IDR', city: 'Indore', name: 'Devi Ahilyabai Holkar Airport' },
  { code: 'RAJ', city: 'Rajkot', name: 'Rajkot Airport' },
  { code: 'STV', city: 'Surat', name: 'Surat Airport' },
  { code: 'UDR', city: 'Udaipur', name: 'Maharana Pratap Airport' },
  { code: 'RPR', city: 'Raipur', name: 'Swami Vivekananda Airport' },
  { code: 'IXR', city: 'Ranchi', name: 'Birsa Munda Airport' },
  { code: 'CJB', city: 'Coimbatore', name: 'Coimbatore Intl' },
  { code: 'IXM', city: 'Madurai', name: 'Madurai Airport' },
  { code: 'TRZ', city: 'Tiruchirappalli', name: 'Trichy Intl' },
  { code: 'IXA', city: 'Agartala', name: 'Maharaja Bir Bikram Airport' },
  { code: 'IMF', city: 'Imphal', name: 'Bir Tikendrajit Intl' },
  { code: 'DIB', city: 'Dibrugarh', name: 'Dibrugarh Airport' },
  { code: 'JLR', city: 'Jabalpur', name: 'Jabalpur Airport' },
  { code: 'DED', city: 'Dehradun', name: 'Jolly Grant Airport' },
  { code: 'IXJ', city: 'Jammu', name: 'Jammu Airport' },
  { code: 'VGA', city: 'Vijayawada', name: 'Vijayawada Airport' },
  { code: 'HBX', city: 'Hubli', name: 'Hubli Airport' },
  { code: 'IXL', city: 'Leh', name: 'Kushok Bakula Rimpochee Airport' },
  { code: 'AGR', city: 'Agra', name: 'Pandit Deen Dayal Upadhyay Airport' },
  { code: 'BHO', city: 'Bhopal', name: 'Raja Bhoj Airport' },
  { code: 'IXS', city: 'Silchar', name: 'Silchar Airport' },
  { code: 'JRH', city: 'Jorhat', name: 'Jorhat Airport' },
  { code: 'DMU', city: 'Dimapur', name: 'Dimapur Airport' },
  { code: 'AYJ', city: 'Ayodhya', name: 'Maharishi Valmiki Intl' },
  // Darbhanga & Bihar
  { code: 'DBR', city: 'Darbhanga', name: 'Darbhanga Airport' },
  { code: 'GYA', city: 'Gaya', name: 'Gaya Airport' },
  // More Tier 2/3
  { code: 'KLR', city: 'Kolhapur', name: 'Kolhapur Airport' },
  { code: 'BDQ', city: 'Vadodara', name: 'Vadodara Airport' },
  { code: 'JDH', city: 'Jodhpur', name: 'Jodhpur Airport' },
  { code: 'KUU', city: 'Kullu', name: 'Bhuntar Airport' },
  { code: 'SLV', city: 'Shimla', name: 'Shimla Airport' },
  { code: 'CNN', city: 'Kannur', name: 'Kannur Intl' },
  { code: 'MYQ', city: 'Mysore', name: 'Mysore Airport' },
  { code: 'IXE', city: 'Mangalore', name: 'Mangalore Intl' },
  { code: 'PBD', city: 'Porbandar', name: 'Porbandar Airport' },
  { code: 'BHJ', city: 'Bhuj', name: 'Bhuj Airport' },
  { code: 'DHM', city: 'Dharamshala', name: 'Gaggal Airport' },
  { code: 'SAG', city: 'Shirdi', name: 'Shirdi Airport' },
  { code: 'KQH', city: 'Kishangarh', name: 'Kishangarh Airport' },
  { code: 'JSA', city: 'Jaisalmer', name: 'Jaisalmer Airport' },
  { code: 'PYB', city: 'Jeypore', name: 'Jeypore Airport' },
  { code: 'IXD', city: 'Prayagraj', name: 'Prayagraj Airport' },
  { code: 'GOP', city: 'Gorakhpur', name: 'Gorakhpur Airport' },
  { code: 'KNU', city: 'Kanpur', name: 'Kanpur Airport' },
  { code: 'TIR', city: 'Tirupati', name: 'Tirupati Airport' },
  { code: 'RJA', city: 'Rajahmundry', name: 'Rajahmundry Airport' },
  { code: 'CDP', city: 'Kadapa', name: 'Kadapa Airport' },
  { code: 'BEK', city: 'Bareilly', name: 'Bareilly Airport' },
  { code: 'IXZ', city: 'Port Blair', name: 'Veer Savarkar Intl' },
];

const INTL_AIRPORTS = [
  { code: 'DXB', city: 'Dubai', name: 'Dubai Intl' },
  { code: 'SIN', city: 'Singapore', name: 'Changi' },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi' },
  { code: 'LHR', city: 'London', name: 'Heathrow' },
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy Intl' },
  { code: 'KUL', city: 'Kuala Lumpur', name: 'KLIA' },
  { code: 'DOH', city: 'Doha', name: 'Hamad Intl' },
  { code: 'AUH', city: 'Abu Dhabi', name: 'Zayed Intl' },
  { code: 'MCT', city: 'Muscat', name: 'Muscat Intl' },
  { code: 'KWI', city: 'Kuwait', name: 'Kuwait Intl' },
  { code: 'BAH', city: 'Bahrain', name: 'Bahrain Intl' },
  { code: 'JED', city: 'Jeddah', name: 'King Abdulaziz Intl' },
  { code: 'RUH', city: 'Riyadh', name: 'King Khalid Intl' },
  { code: 'CMB', city: 'Colombo', name: 'Bandaranaike Intl' },
  { code: 'DAC', city: 'Dhaka', name: 'Hazrat Shahjalal Intl' },
  { code: 'KTM', city: 'Kathmandu', name: 'Tribhuvan Intl' },
  { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong Intl' },
  { code: 'NRT', city: 'Tokyo', name: 'Narita Intl' },
  { code: 'ICN', city: 'Seoul', name: 'Incheon Intl' },
  { code: 'SYD', city: 'Sydney', name: 'Kingsford Smith' },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt Airport' },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle' },
  { code: 'YYZ', city: 'Toronto', name: 'Pearson Intl' },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco Intl' },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles Intl' },
  { code: 'MLE', city: 'Male', name: 'Velana Intl (Maldives)' },
  { code: 'MRU', city: 'Mauritius', name: 'Sir Seewoosagur Ramgoolam Intl' },
];

const ALL_AIRPORTS = [...INDIAN_AIRPORTS, ...INTL_AIRPORTS];
const INDIAN_CODES = new Set(INDIAN_AIRPORTS.map(a => a.code));

const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
];

export default function FlightsPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState('economy');
  const [roundTrip, setRoundTrip] = useState(false);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [showDepCal, setShowDepCal] = useState(false);
  const [showRetCal, setShowRetCal] = useState(false);
  const [showTravellers, setShowTravellers] = useState(false);

  const passengers = adults + children + infants;
  const depTileRef = useRef<HTMLDivElement>(null);
  const retTileRef = useRef<HTMLDivElement>(null);
  const travTileRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click / Escape
  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const t = ev.target as Node;
      if (showDepCal && depTileRef.current && !depTileRef.current.contains(t)) setShowDepCal(false);
      if (showRetCal && retTileRef.current && !retTileRef.current.contains(t)) setShowRetCal(false);
      if (showTravellers && travTileRef.current && !travTileRef.current.contains(t)) setShowTravellers(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') { setShowDepCal(false); setShowRetCal(false); setShowTravellers(false); }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [showDepCal, showRetCal, showTravellers]);

  const filteredOrigins = ALL_AIRPORTS.filter(
    a =>
      a.code.toLowerCase().includes(originSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(originSearch.toLowerCase()) ||
      a.name.toLowerCase().includes(originSearch.toLowerCase())
  );

  const filteredDests = ALL_AIRPORTS.filter(
    a =>
      a.code.toLowerCase().includes(destSearch.toLowerCase()) ||
      a.city.toLowerCase().includes(destSearch.toLowerCase()) ||
      a.name.toLowerCase().includes(destSearch.toLowerCase())
  );

  const getAirportLabel = (code: string) => {
    const a = ALL_AIRPORTS.find(ap => ap.code === code);
    return a ? `${a.code} - ${a.city}` : code;
  };

  const today = new Date().toISOString().split('T')[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin || !destination || !departureDate) return;
    const isInternational = !INDIAN_CODES.has(origin) || !INDIAN_CODES.has(destination);
    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      passengers: String(passengers),
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      cabinClass,
      international: String(isInternational),
    });
    if (roundTrip && returnDate) params.set('returnDate', returnDate);
    router.push(`/flights/results?${params.toString()}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#003B95] to-[#0052CC] text-white">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Book Flights with Safar</h1>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl">
            Compare prices, earn Safar Miles, and seamlessly connect your flights with stays and cooks.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 text-gray-800">
            {/* Trip type toggle */}
            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setRoundTrip(false)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  !roundTrip ? 'bg-[#003B95] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                One Way
              </button>
              <button
                type="button"
                onClick={() => setRoundTrip(true)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  roundTrip ? 'bg-[#003B95] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Round Trip
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Origin */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1">From</label>
                <input
                  type="text"
                  placeholder="City or airport code"
                  value={origin ? getAirportLabel(origin) : originSearch}
                  onChange={(e) => {
                    setOriginSearch(e.target.value);
                    setOrigin('');
                    setShowOriginPicker(true);
                  }}
                  onFocus={() => setShowOriginPicker(true)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                />
                {showOriginPicker && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredOrigins.map((a) => (
                      <button
                        key={a.code}
                        type="button"
                        onClick={() => {
                          setOrigin(a.code);
                          setOriginSearch('');
                          setShowOriginPicker(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-sm"
                      >
                        <span className="font-bold text-[#003B95] w-10">{a.code}</span>
                        <span className="text-gray-700">{a.city}</span>
                        <span className="text-gray-400 text-xs ml-auto truncate">{a.name}</span>
                      </button>
                    ))}
                    {filteredOrigins.length === 0 && (
                      <p className="text-sm text-gray-400 px-4 py-3">No airports found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-600 mb-1">To</label>
                <input
                  type="text"
                  placeholder="City or airport code"
                  value={destination ? getAirportLabel(destination) : destSearch}
                  onChange={(e) => {
                    setDestSearch(e.target.value);
                    setDestination('');
                    setShowDestPicker(true);
                  }}
                  onFocus={() => setShowDestPicker(true)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003B95] focus:border-transparent"
                />
                {showDestPicker && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredDests.map((a) => (
                      <button
                        key={a.code}
                        type="button"
                        onClick={() => {
                          setDestination(a.code);
                          setDestSearch('');
                          setShowDestPicker(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 text-sm"
                      >
                        <span className="font-bold text-[#003B95] w-10">{a.code}</span>
                        <span className="text-gray-700">{a.city}</span>
                        <span className="text-gray-400 text-xs ml-auto truncate">{a.name}</span>
                      </button>
                    ))}
                    {filteredDests.length === 0 && (
                      <p className="text-sm text-gray-400 px-4 py-3">No airports found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Departure Date — MMT-style tile */}
              <div className="relative" ref={depTileRef}>
                <DateTile
                  caption="DEPARTURE"
                  iso={departureDate}
                  placeholder="Select date"
                  onClick={() => { setShowDepCal(v => !v); setShowRetCal(false); setShowTravellers(false); }}
                  active={showDepCal}
                />
                {showDepCal && (
                  <div className="absolute z-30 mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">
                    <DatePicker
                      selected={departureDate ? new Date(departureDate) : null}
                      onChange={(d) => {
                        if (!d) return;
                        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().split('T')[0];
                        setDepartureDate(iso);
                        if (returnDate && returnDate < iso) setReturnDate('');
                        setShowDepCal(false);
                      }}
                      minDate={new Date()}
                      monthsShown={2}
                      inline
                      calendarClassName="safar-cal"
                    />
                  </div>
                )}
              </div>

              {/* Return Date — MMT-style tile */}
              <div className="relative" ref={retTileRef}>
                <DateTile
                  caption={`RETURN${!roundTrip ? ' (optional)' : ''}`}
                  iso={returnDate}
                  placeholder={roundTrip ? 'Select date' : 'Tap to add'}
                  onClick={() => {
                    if (!roundTrip) setRoundTrip(true);
                    setShowRetCal(v => !v); setShowDepCal(false); setShowTravellers(false);
                  }}
                  active={showRetCal}
                />
                {showRetCal && (
                  <div className="absolute z-30 mt-2 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">
                    <DatePicker
                      selected={returnDate ? new Date(returnDate) : null}
                      onChange={(d) => {
                        if (!d) return;
                        const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().split('T')[0];
                        setReturnDate(iso);
                        setShowRetCal(false);
                      }}
                      minDate={departureDate ? new Date(departureDate) : new Date()}
                      monthsShown={2}
                      inline
                      calendarClassName="safar-cal"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Travellers & Class — MMT-style tile */}
              <div className="relative md:col-span-2" ref={travTileRef}>
                <button
                  type="button"
                  onClick={() => { setShowTravellers(v => !v); setShowDepCal(false); setShowRetCal(false); }}
                  className={`w-full text-left border rounded-xl px-4 py-3 transition bg-white ${
                    showTravellers ? 'border-[#003B95] ring-2 ring-[#003B95]/20' : 'border-gray-300 hover:border-[#003B95]/60'
                  }`}
                >
                  <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">Travellers & Class</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{passengers} <span className="text-sm font-medium text-gray-600">Traveller{passengers !== 1 ? 's' : ''}</span></p>
                  <p className="text-xs text-gray-500">
                    {adults} Adult{adults !== 1 ? 's' : ''}{children ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}{infants ? `, ${infants} Infant${infants !== 1 ? 's' : ''}` : ''} · {CABIN_CLASSES.find(c => c.value === cabinClass)?.label}
                  </p>
                </button>
                {showTravellers && (
                  <div className="absolute z-30 mt-2 left-0 right-0 md:right-auto md:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
                    <PaxRow label="Adults" hint="12 yrs +" value={adults}
                            min={1} max={9 - children - infants}
                            onChange={v => setAdults(v)} />
                    <PaxRow label="Children" hint="2 – 11 yrs" value={children}
                            min={0} max={Math.max(0, 9 - adults - infants)}
                            onChange={v => setChildren(v)} />
                    <PaxRow label="Infants" hint="below 2 yrs · on lap" value={infants}
                            min={0} max={Math.min(adults, 9 - adults - children)}
                            onChange={v => setInfants(v)} />

                    <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase mt-4 mb-2">Travel Class</p>
                    <div className="flex flex-wrap gap-2">
                      {CABIN_CLASSES.map((c) => (
                        <button key={c.value} type="button"
                                onClick={() => setCabinClass(c.value)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                                  cabinClass === c.value
                                    ? 'bg-[#003B95] border-[#003B95] text-white'
                                    : 'border-gray-300 text-gray-700 hover:border-[#003B95]/60'
                                }`}>
                          {c.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-end mt-5">
                      <button type="button" onClick={() => setShowTravellers(false)}
                              className="px-5 py-2 rounded-lg bg-[#003B95] hover:bg-[#002d73] text-white text-sm font-semibold transition">
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!origin || !destination || !departureDate}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition text-sm h-[72px]"
                >
                  Search Flights
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Why book with Safar */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Book Flights with Safar?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">&#x2B50;</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Earn Safar Miles</h3>
            <p className="text-sm text-gray-500">
              Every flight booked earns you Safar Miles. Redeem them for discounts on stays, cooks, and future flights.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">&#x1F3E0;</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Cross-sell with Stays &amp; Cooks</h3>
            <p className="text-sm text-gray-500">
              Book a flight and instantly find stays at your destination. Add a personal cook for a complete trip experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MMT/Yatra-style date tile ──────────────────────────────────
function DateTile({ caption, iso, placeholder, onClick, active }: {
  caption: string;
  iso: string;
  placeholder: string;
  onClick: () => void;
  active: boolean;
}) {
  const d = iso ? new Date(iso + 'T00:00:00') : null;
  const day = d ? d.getDate() : null;
  const monthYear = d ? d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '';
  const weekday = d ? d.toLocaleDateString('en-IN', { weekday: 'long' }) : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border rounded-xl px-4 py-3 transition bg-white ${
        active ? 'border-[#003B95] ring-2 ring-[#003B95]/20' : 'border-gray-300 hover:border-[#003B95]/60'
      }`}
    >
      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">{caption}</p>
      {d ? (
        <>
          <p className="mt-0.5">
            <span className="text-3xl font-bold text-gray-900 leading-none">{day}</span>
            <span className="ml-1 text-sm font-medium text-gray-700">{monthYear.replace(' ', " '")}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{weekday}</p>
        </>
      ) : (
        <p className="text-sm text-gray-400 mt-2">{placeholder}</p>
      )}
    </button>
  );
}

// ── Passenger row with - / + steppers ──────────────────────────
function PaxRow({ label, hint, value, min, max, onChange }: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-500">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={dec} disabled={value <= min}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:border-[#003B95] hover:text-[#003B95] disabled:opacity-30 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center transition">
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
        <button type="button" onClick={inc} disabled={value >= max}
                className="w-8 h-8 rounded-full border border-gray-300 text-gray-700 hover:border-[#003B95] hover:text-[#003B95] disabled:opacity-30 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center transition">
          +
        </button>
      </div>
    </div>
  );
}
