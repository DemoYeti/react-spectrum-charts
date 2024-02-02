/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { render, screen } from '@test-utils';

import {
	CompactFormat,
	CurrencyFormat,
	IconHorizontal,
	IconVertical,
	NullData,
	PercentageFormat,
	UndefinedData,
} from './BigNumber.story';

describe('BigNumber', () => {
	describe('BigNumber with icon prop passed in', () => {
		test('IconVertical renders with correct icon present', async () => {
			render(<IconVertical {...IconVertical.args} />);
			const icon = await screen.findByTestId('icon-amusementpark');
			expect(icon).toBeInTheDocument();
			const value = await screen.findByText('255');
			expect(value).toBeInTheDocument();
			const label = await screen.findByText(IconVertical.args.label);
			expect(label).toBeInTheDocument();
		});

		test('IconHorizontal renders with correct icon present', async () => {
			render(<IconHorizontal {...IconHorizontal.args} />);
			const icon = await screen.findByTestId('icon-calendar');
			expect(icon).toBeInTheDocument();
			const value = await screen.findByText('255');
			expect(value).toBeInTheDocument();
			const label = await screen.findByText(IconHorizontal.args.label);
			expect(label).toBeInTheDocument();
		});
	});
	describe('BigNumber error states', () => {
		test('NullData renders correct warning icon and text', async () => {
			render(<NullData {...NullData.args} />);
			const errorMessage = await screen.findByText('Unable to load. One or more values are null.');
			expect(errorMessage).toBeInTheDocument();
			const actionMessage = await screen.findByText('Please check incoming data');
			expect(actionMessage).toBeInTheDocument();
			const nullIcon = await screen.findByTestId('alert-circle');
			expect(nullIcon).toBeInTheDocument();
		});

		test('UndefinedData renders appropriate warning icon and text', async () => {
			render(<UndefinedData {...UndefinedData.args} />);
			const errorDescription = await screen.findByText('No data available.');
			const actionText = await screen.findByText('Please verify that data is defined');
			expect(errorDescription).toBeInTheDocument();
			expect(actionText).toBeInTheDocument();
			const undefinedIcon = await screen.findByTestId('vertical-graph');
			expect(undefinedIcon).toBeInTheDocument();
		});
	});
	describe('BigNumber using numberFormat', () => {
		test('CurrencyFormat renders with formatted value', async () => {
			render(<CurrencyFormat {...CurrencyFormat.args} />);
			const formattedValue = await screen.findByText('255,56 €');
			expect(formattedValue).toBeInTheDocument();
		});

		test('PercentageFormat renders with formatted value', async () => {
			render(<PercentageFormat {...PercentageFormat.args} />);
			const formattedValue = await screen.findByText('25%');
			expect(formattedValue).toBeInTheDocument();
		});

		test('CompactFormat renders with formatted value', async () => {
			render(<CompactFormat {...CompactFormat.args} />);
			const formattedValue = await screen.findByText('12.3B');
			expect(formattedValue).toBeInTheDocument();
		});
	});
});
