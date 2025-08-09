export type WeatherNow = {
  tempC: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "other";
  windSpeed: number;
};

export type ForecastItem = {
  date: string; // ISO date
  weekday: string;
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "other";
  tempC: number;
  tempMin: number;
  tempMax: number;
  wind: number;
  windDir: number;
  humidity: number;
  visibility: number;
  precipitation: number;
  pressure: number;
};

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherNow> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  const code = data.current_weather?.weathercode ?? 0;
  let condition: WeatherNow["condition"] = "other";
  if ([0, 1].includes(code)) condition = "sunny";
  else if ([2, 3, 45, 48].includes(code)) condition = "cloudy";
  else if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) condition = "rainy";
  else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = "snowy";
  return {
    tempC: Math.round(data.current_weather?.temperature ?? 0),
    windSpeed: Math.round(data.current_weather?.windspeed ?? 0),
    condition,
  };
}

export async function fetch7Day(lat: number, lon: number): Promise<ForecastItem[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,winddirection_10m_dominant,relative_humidity_2m_max,visibility_mean,precipitation_sum,surface_pressure_mean&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  const days: ForecastItem[] = (data.daily?.time || []).slice(0, 7).map((date: string, i: number) => {
    const code = data.daily.weathercode?.[i] ?? 0;
    let condition: ForecastItem["condition"] = "other";
    if ([0, 1].includes(code)) condition = "sunny";
    else if ([2, 3, 45, 48].includes(code)) condition = "cloudy";
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) condition = "rainy";
    else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = "snowy";
    return {
      date,
      weekday: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
      condition,
      tempC: Math.round((data.daily.temperature_2m_max?.[i] + data.daily.temperature_2m_min?.[i]) / 2),
      tempMin: Math.round(data.daily.temperature_2m_min?.[i] ?? 0),
      tempMax: Math.round(data.daily.temperature_2m_max?.[i] ?? 0),
      wind: Math.round(data.daily.windspeed_10m_max?.[i] ?? 0),
      windDir: Math.round(data.daily.winddirection_10m_dominant?.[i] ?? 0),
      humidity: Math.round(data.daily.relative_humidity_2m_max?.[i] ?? 0),
      visibility: Math.round(data.daily.visibility_mean?.[i] ?? 0),
      precipitation: Math.round(data.daily.precipitation_sum?.[i] ?? 0),
      pressure: Math.round(data.daily.surface_pressure_mean?.[i] ?? 0),
    };
  });
  return days;
}

export function calcSuitability(item: ForecastItem): number {
  let score = 100;
  if (item.tempC < 10) score -= 30;
  else if (item.tempC < 18) score -= 10;
  else if (item.tempC > 28) score -= 25;
  else if (item.tempC > 25) score -= 10;
  if (item.humidity < 40) score -= 10;
  else if (item.humidity > 80) score -= 15;
  if (item.wind > 10) score -= 25;
  else if (item.wind > 6) score -= 10;
  if (item.visibility < 4000) score -= 20;
  else if (item.visibility < 8000) score -= 10;
  if (item.precipitation > 0) score -= 20;
  if (item.pressure < 990 || item.pressure > 1030) score -= 10;
  if (item.condition === "rainy" || item.condition === "snowy") score -= 30;
  else if (item.condition === "cloudy") score -= 5;
  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return Math.round(score);
}