/**
 * Returns the current date/time adjusted to Africa/Lagos time zone (WAT, UTC+1).
 * This ensures consistency across different client locations.
 */
export const getNigerianNow = (): Date => {
  const now = new Date();
  // Lagos is UTC+1. 
  // We can use Intl to get the string in Lagos time and parse it back to a date object
  // or use the offset directly if we want to be simple (though DST doesn't apply to Nigeria).
  
  // Method using Intl for accuracy:
  const lagosString = now.toLocaleString('en-US', { timeZone: 'Africa/Lagos' });
  return new Date(lagosString);
};

/**
 * Parses a slot date (DD_MM_YYYY) and slot time (HH:MM AM/PM) 
 * into a Date object specifically in Africa/Lagos time.
 */
export const parseNigerianDate = (slotDate: string, slotTime: string): Date => {
  const dateArray = slotDate.split('_');
  const day = parseInt(dateArray[0]);
  const month = parseInt(dateArray[1]) - 1;
  const year = parseInt(dateArray[2]);
  
  const timeMatch = slotTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return new Date();
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2]);
  const period = timeMatch[3].toUpperCase();
  
  if (period === 'AM' && hours === 12) hours = 0;
  else if (period === 'PM' && hours !== 12) hours += 12;
  
  // First create a date in current environment
  // Then we need to ensure this is interpreted as Lagos time.
  // The simplest way to handle this consistently for "diff" calculations is to 
  // compare two dates that are both in the same zone.
  
  const localDate = new Date(year, month, day, hours, minutes);
  return localDate;
};
