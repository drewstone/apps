// Copyright 2017-2021 @polkadot/app-treasury authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { DeriveCollectiveProposal } from '@polkadot/api-derive/types';
import type { Balance, BountyIndex } from '@polkadot/types/interfaces';

import BN from 'bn.js';
import React, { useEffect, useMemo, useState } from 'react';

import { truncateTitle } from '@polkadot/app-bounties/helpers';
import { getTreasuryProposalThreshold } from '@polkadot/apps-config';
import { Button, InputAddress, InputBalance, MarkError, Modal, TxButton } from '@polkadot/react-components';
import { useApi, useMembers, useToggle } from '@polkadot/react-hooks';
import { BN_ZERO } from '@polkadot/util';

import { useBounties } from './hooks';
import { useTranslation } from './translate';

interface Props {
  description: string
  index: BountyIndex;
  proposals?: DeriveCollectiveProposal[];
  value: Balance;
}

const BOUNTY_METHODS = ['proposeCurator'];

function ProposeCuratorAction ({ description, index, proposals, value }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { api } = useApi();
  const { isMember, members } = useMembers();
  const { proposeCurator } = useBounties();
  const [isOpen, toggleOpen] = useToggle();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [curatorId, setCuratorId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<BN>();
  const [fee, setFee] = useState<BN>(BN_ZERO);
  const [isFeeValid, setIsFeeValid] = useState(false);

  useEffect((): void => {
    members && setThreshold(
      new BN(Math.ceil(members.length * getTreasuryProposalThreshold(api)))
    );
  }, [api, members]);

  const proposeCuratorProposal = useMemo(() => curatorId && proposeCurator(index, curatorId, fee), [curatorId, fee, index, proposeCurator]);

  const isVotingInitiated = useMemo(() => proposals?.filter(({ proposal }) => BOUNTY_METHODS.includes(proposal.method)).length !== 0, [proposals]);

  useEffect(() => {
    setIsFeeValid(!!value?.gt(fee));
  }, [value, fee]);

  return isMember && !isVotingInitiated
    ? (
      <>
        <Button
          icon='step-forward'
          isDisabled={false}
          label={t<string>('Propose Curator')}
          onClick={toggleOpen}
        />
        {isOpen && (
          <Modal
            header={t<string>(`Assign Curator to "${truncateTitle(description, 30)}"`)}
            size='large'
          >
            <Modal.Content>
              <Modal.Column>
                <p>{t<string>('This action will create a Council motion to assign a Curator.')}</p>
              </Modal.Column>
              <Modal.Columns>
                <Modal.Column>
                  <InputAddress
                    filter={members}
                    help={t<string>('Select the council account you wish to use to create a motion for the Bounty.')}
                    label={t<string>('proposing account')}
                    onChange={setAccountId}
                    type='account'
                    withLabel
                  />
                </Modal.Column>
                <Modal.Column>
                  <p>{t<string>('The council member that will create the motion.')}</p>
                </Modal.Column>
              </Modal.Columns>
              <Modal.Columns>
                <Modal.Column>
                  <InputAddress
                    help={t<string>('Select an account which (after a successful vote) will act as a curator.')}
                    label={t<string>('select curator')}
                    onChange={setCuratorId}
                    type='account'
                    withLabel
                  />
                </Modal.Column>
                <Modal.Column>
                  <p>{t<string>('Choose a curator whose background and expertise is such that they are capable of determining when the task is complete.')}</p>
                </Modal.Column>
              </Modal.Columns>
              <Modal.Columns>
                <Modal.Column>
                  <InputBalance
                    help={t<string>('A reward for a curator, this amount is included in the total value of the bounty.')}
                    isError={!isFeeValid}
                    isZeroable
                    label={t<string>("curator's fee")}
                    onChange={setFee}
                    value={fee}
                  />
                  {!isFeeValid && (
                    <MarkError content={t<string>("Curator's fee can't be higher than bounty value.")} />
                  )}
                </Modal.Column>
                <Modal.Column>
                  <p>{t<string>('Part of the bounty value that will go to the Curator as a reward for their work')}</p>
                </Modal.Column>
              </Modal.Columns>
            </Modal.Content>
            <Modal.Actions onCancel={toggleOpen}>
              <TxButton
                accountId={accountId}
                icon='check'
                isDisabled={!isFeeValid}
                label={t<string>('Assign curator')}
                onStart={toggleOpen}
                params={[threshold, proposeCuratorProposal, proposeCuratorProposal?.length]}
                tx={api.tx.council.propose}
              />
            </Modal.Actions>
          </Modal>
        )}
      </>
    )
    : null;
}

export default React.memo(ProposeCuratorAction);
