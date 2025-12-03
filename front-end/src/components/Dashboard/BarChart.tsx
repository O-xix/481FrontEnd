import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface YearlyStats {
  year: number;
  count: number;
}

interface BarChartProps {
  data: YearlyStats[];
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 400,
  marginTop = 20,
  marginRight = 30,
  marginBottom = 30,
  marginLeft = 40,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const newWidth = entry.contentRect.width;
        setDimensions({ width: newWidth, height });
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [height]); // Re-run if height prop changes

  useEffect(() => {
    if (!data || data.length === 0) return;

    const { width } = dimensions;
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const x = d3.scaleBand()
      .domain(data.map(d => d.year.toString())) // x-axis for years
      .range([marginLeft, width - marginRight])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count)!]).nice() // y-axis for counts
      .range([height - marginBottom, marginTop]);

    // Draw bars
    svg.append('g')
      .attr('fill', 'steelblue')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.year.toString())!)
      .attr('y', d => y(d.count))
      .attr('height', d => y(0) - y(d.count))
      .attr('width', x.bandwidth());

    // Add x-axis
    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add y-axis
    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).tickFormat(d3.format(".2s"))) // Format large numbers
      .call(g => g.select('.domain').remove()) // Remove y-axis line
      .call(g => g.append('text')
        .attr('x', -marginLeft)
        .attr('y', 10)
        .attr('fill', 'currentColor')
        .attr('text-anchor', 'start')
        .text('↑ Accident Count'));

    // Add tooltips (simple title attribute for now)
    svg.selectAll('rect')
      .append('title')
      .text(d => `Year: ${d.year}\nAccidents: ${d.count.toLocaleString()}`);

  }, [data, dimensions, height, marginTop, marginRight, marginBottom, marginLeft]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: `${height}px` }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BarChart;