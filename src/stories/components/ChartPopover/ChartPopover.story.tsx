/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { Content } from '@adobe/react-spectrum';
import usePrismProps from '@hooks/usePrismProps';
import { Area, Axis, Bar, ChartPopover, ChartTooltip, Legend, Line, Prism, PrismProps } from '@prism';
import { browserData as data } from '@stories/data/data';
import { ComponentStory } from '@storybook/react';
import { bindWithProps } from '@test-utils';
import React, { ReactElement } from 'react';

export default {
	title: 'Prism/ChartPopover',
	component: ChartPopover,
	argTypes: {
		children: {
			description: '`(datum: Datum, close: () => void)`',
			control: {
				type: null,
			},
		},
	},
	parameters: {
		docs: {
			description: {
				component: 'This is _markdown_ enabled description for ChartPopover component doc page.',
			},
		},
	},
};

const dialogContent = (datum) => (
	<Content>
		<div>Operating system: {datum.series}</div>
		<div>Browser: {datum.category}</div>
		<div>Users: {datum.value}</div>
	</Content>
);

const defaultPrismProps: PrismProps = { data, renderer: 'svg', width: 600 };

const ChartPopoverCanvasStory: ComponentStory<typeof ChartPopover> = (args): ReactElement => {
	const prismProps = usePrismProps({ data, renderer: 'canvas', width: 600 });
	return (
		<Prism {...prismProps}>
			<Bar color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Bar>
		</Prism>
	);
};

const ChartPopoverSvgStory: ComponentStory<typeof ChartPopover> = (args): ReactElement => {
	const prismProps = usePrismProps(defaultPrismProps);
	return (
		<Prism {...prismProps}>
			<Bar color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Bar>
		</Prism>
	);
};

const ChartPopoverDodgedBarStory: ComponentStory<typeof ChartPopover> = (args): ReactElement => {
	const prismProps = usePrismProps(defaultPrismProps);
	return (
		<Prism {...prismProps}>
			<Bar color="series" type="dodged">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Bar>
		</Prism>
	);
};

const LineStory: ComponentStory<typeof ChartPopover> = (args): ReactElement => {
	const prismProps = usePrismProps(defaultPrismProps);
	return (
		<Prism {...prismProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Line scaleType="point" dimension="category" color="series">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Line>
			<Legend />
		</Prism>
	);
};

const AreaStory: ComponentStory<typeof ChartPopover> = (args): ReactElement => {
	const prismProps = usePrismProps(defaultPrismProps);
	return (
		<Prism {...prismProps}>
			<Axis position="bottom" baseline />
			<Axis position="left" grid />
			<Area scaleType="point" dimension="category">
				<ChartTooltip>{dialogContent}</ChartTooltip>
				<ChartPopover {...args} />
			</Area>
			<Legend />
		</Prism>
	);
};

const Canvas = bindWithProps(ChartPopoverCanvasStory);
Canvas.args = { children: dialogContent, width: 250 };

const Svg = bindWithProps(ChartPopoverSvgStory);
Svg.args = { children: dialogContent, width: 250 };

const AreaChart = bindWithProps(AreaStory);
AreaChart.args = { children: dialogContent };

const DodgedBarChart = bindWithProps(ChartPopoverDodgedBarStory);
DodgedBarChart.args = { children: dialogContent, width: 250 };

const LineChart = bindWithProps(LineStory);
LineChart.args = { children: dialogContent };

const StackedBarChart = bindWithProps(ChartPopoverSvgStory);
StackedBarChart.args = { children: dialogContent, width: 250 };

export { Canvas, Svg, AreaChart, DodgedBarChart, LineChart, StackedBarChart };
