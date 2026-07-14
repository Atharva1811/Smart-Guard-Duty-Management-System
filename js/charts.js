// js/charts.js
// Custom light-weight SVG and CSS based dashboard charting library

export const charts = {
  // Render an SVG Donut/Pie Chart
  renderDonutChart: (containerId, data) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-muted-foreground text-center py-8">No data available</div>';
      return;
    }

    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    // Helper to calculate X and Y coordinates for slice
    const getCoordinatesForPercent = (percent) => {
      const x = Math.cos(2 * Math.PI * percent);
      const y = Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    let paths = [];
    
    data.forEach((slice) => {
      const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
      const slicePercent = slice.value / total;
      cumulativePercent += slicePercent;
      const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

      // If slice is 100%, show full circle
      if (slicePercent >= 0.999) {
        paths.push(`<circle cx="0" cy="0" r="1" fill="none" stroke="${slice.color}" stroke-width="0.4" />`);
        return;
      }

      const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
      const pathData = [
        `M ${startX} ${startY}`, // Move to starting point
        `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc to ending point
        `L 0 0`, // Line back to center
        `Z` // Close path
      ].join(' ');

      paths.push(`<path d="${pathData}" fill="${slice.color}" class="hover:opacity-90 transition-opacity cursor-pointer"><title>${slice.name}: ${slice.value} (${Math.round(slicePercent * 100)}%)</title></path>`);
    });

    const svg = `
      <div class="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
        <svg viewBox="-1.2 -1.2 2.4 2.4" class="w-40 h-40 transform -rotate-90">
          ${paths.join('')}
          <circle cx="0" cy="0" r="0.65" class="fill-card transition-colors duration-200" />
          <text x="0" y="0.1" text-anchor="middle" font-size="0.25" font-weight="bold" class="fill-foreground font-sans">
            ${total}
          </text>
        </svg>
        <div class="flex flex-col gap-2">
          ${data.map(slice => `
            <div class="flex items-center gap-2 text-xs font-medium">
              <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${slice.color}"></span>
              <span class="text-muted-foreground">${slice.name}:</span>
              <span class="text-foreground font-semibold">${slice.value} (${Math.round((slice.value / total) * 100)}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = svg;
  },

  // Render a CSS/HTML Bar Chart
  renderBarChart: (containerId, data, xKey, yKey, colors = ['#3b82f6']) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-muted-foreground text-center py-8">No data available</div>';
      return;
    }

    const maxVal = Math.max(...data.map(d => Number(d[yKey]) || 0), 1);

    const bars = data.map((d, index) => {
      const val = Number(d[yKey]) || 0;
      const heightPercent = Math.max(Math.round((val / maxVal) * 100), 4);
      const color = colors[index % colors.length];

      return `
        <div class="flex flex-col items-center flex-1 h-full min-w-[32px] group relative">
          <div class="text-[10px] font-bold text-foreground mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-5 bg-card border border-border px-1.5 py-0.5 rounded shadow-sm z-10">
            ${val}
          </div>
          <div class="w-full flex-1 flex items-end">
            <div class="w-full rounded-t-md hover:brightness-105 transition-all duration-200" style="height: ${heightPercent}%; background-color: ${color}"></div>
          </div>
          <div class="text-[10px] text-muted-foreground mt-2 truncate w-full text-center">
            ${d[xKey]}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="flex items-end justify-between h-48 gap-3 pt-6 border-b border-border w-full pb-1">
        ${bars}
      </div>
    `;
  },

  // Render an SVG Line Chart
  renderLineChart: (containerId, data, xKey, yKey, lineColor = '#10b981') => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-muted-foreground text-center py-8">No data available</div>';
      return;
    }

    const values = data.map(d => Number(d[yKey]) || 0);
    const maxVal = Math.max(...values, 100);
    const minVal = Math.min(...values, 0);
    const valRange = maxVal - minVal;

    const width = 500;
    const height = 150;
    const padding = 20;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, index) => {
      const val = Number(d[yKey]) || 0;
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((val - minVal) / valRange) * chartHeight;
      return { x, y, val, label: d[xKey] };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const circles = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="${lineColor}" stroke="#ffffff" stroke-width="1" class="cursor-pointer hover:r-6 transition-all duration-200">
        <title>${p.label}: ${p.val}%</title>
      </circle>
    `).join('');

    const gridLines = [0, 0.25, 0.5, 0.75, 1].map(percent => {
      const y = padding + percent * chartHeight;
      const val = Math.round(maxVal - percent * valRange);
      return `
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="currentColor" stroke-dasharray="2 4" class="text-border/50" />
        <text x="${padding - 5}" y="${y + 3}" text-anchor="end" font-size="8" class="fill-muted-foreground">${val}%</text>
      `;
    }).join('');

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full">
        ${gridLines}
        <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${circles}
        ${points.map((p, i) => i % Math.max(1, Math.round(data.length / 5)) === 0 ? `
          <text x="${p.x}" y="${height - 2}" text-anchor="middle" font-size="8" class="fill-muted-foreground">${p.label}</text>
        ` : '').join('')}
      </svg>
    `;

    container.innerHTML = svg;
  }
};
