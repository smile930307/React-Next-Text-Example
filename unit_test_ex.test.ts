import React from 'react';
import { waitFor } from '@testing-library/react';
import { createRtlRenderer } from 'tests/utils/createRenderer/createRtlRenderer';
import userEvent from '@testing-library/user-event';
import { DropDownMenu, FSDropdown, ValidatedDropDownMenu } from '.';
import {
  clickDropDownMenu,
  clickMenuItem,
  expectDropDownItem,
  expectDropDownMenu,
  expectNoDropDownItem,
  expectNoValidationError,
  expectSelectedItem,
  expectValidationError,
} from './index.test-utils';

const placeHolderText = 'Select State';
const label = 'State';

describe('ValidatedDropDownMenu', () => {
  const validateOptionSelected = (value: unknown) => {
    return value ? null : <span>This field is required!</span>;
  };
  const onSelect = jest.fn();
  // @ts-expect-error - deprecated component
  const render = createRtlRenderer(ValidatedDropDownMenu, {
    dataTestid: 'test-select-an-option',
    defaultValue: '',
    id: 'selectAnOption',
    label,
    onSelect,
    options: [
      { text: 'California', value: 'ca' },
      { text: 'Florida', value: 'fl' },
      { text: 'New York', value: 'ny' },
    ],
    placeHolderText,
    validate: validateOptionSelected,
  });

  it('should display error when invalid', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    await waitFor(userEvent.tab);
    expectValidationError();
  });

  it('should not display error when valid', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    await clickMenuItem('California');
    userEvent.tab();
    expectNoValidationError();
  });
});

describe('DropDownMenu', () => {
  const onSelect = jest.fn();
  // @ts-expect-error - deprecated component
  const render = createRtlRenderer(DropDownMenu, {
    label,
    onSelect,
    options: [
      { text: 'California', value: 'ca' },
      { text: 'Florida', value: 'fl' },
      { text: 'New York', value: 'ny' },
    ],
    placeHolderText,
  });

  it('should display placeholder and label text when passing it', async () => {
    await render();
    expectDropDownMenu(placeHolderText);
  });

  it('should select default value when passing it', async () => {
    // @ts-expect-error - missing prop defaultValue on propTypes
    await render({ defaultValue: 'ca' });
    await expectSelectedItem('California');
  });

  it('should display menu items when clicked', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    await expectDropDownItem('California');
    await expectDropDownItem('Florida');
    await expectDropDownItem('New York');
  });

  it('should toggle menu items when double-clicked', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    clickDropDownMenu(placeHolderText);
    await expectNoDropDownItem('California');
    await expectNoDropDownItem('Florida');
    await expectNoDropDownItem('New York');
  });

  it('should call onSelect when item is clicked', async () => {
    const expectCallArguments = {
      target: { type: 'select-one', value: 'ca' },
      value: 'ca',
    };
    await render();
    clickDropDownMenu(placeHolderText);
    await clickMenuItem('California');
    expect(onSelect).toHaveBeenCalledWith(expectCallArguments);
  });
});

describe('FSDropdown', () => {
  const onSelect = jest.fn();
  const onSelectItem = jest.fn();
  const render = createRtlRenderer(FSDropdown, {
    children: (
      <>
        <FSDropdown.Toggle>{placeHolderText}</FSDropdown.Toggle>
        <FSDropdown.Menu>
          <FSDropdown.Item eventKey="california" onSelect={onSelectItem}>
            California
          </FSDropdown.Item>
          <FSDropdown.Item eventKey="texas" onSelect={onSelectItem}>
            Texas
          </FSDropdown.Item>
        </FSDropdown.Menu>
      </>
    ),
    dataTestid: 'select-state',
    onSelect,
  });

  it('should display menu items when clicked', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    await expectDropDownItem('California');
    await expectDropDownItem('Texas');
  });

  it('should toggle menu items when double-clicked', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    await expectDropDownItem('California');
    clickDropDownMenu(placeHolderText);
    await expectNoDropDownItem('California');
  });

  it('should call both onSelect and onSelectItem handlers when item is clicked', async () => {
    await render();
    clickDropDownMenu(placeHolderText);
    await clickMenuItem('California');
    expect(onSelectItem).toHaveBeenCalledWith('california', expect.anything());
    expect(onSelect).toHaveBeenCalledWith('california', expect.anything());
  });
});
