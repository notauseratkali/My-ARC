import React, { useState } from 'react';
import {
  RoverOperatingPolicy,
  PolicyAmendmentPoll,
  Member,
  PolicyVote,
} from '../types';
import {
  FileText,
  Vote,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  Users,
  ShieldAlert,
  ChevronRight,
  Send,
  Calendar,
  Sparkles,
  Crown,
  Edit3,
  HelpCircle,
  Check,
} from 'lucide-react';
import { RichDocumentEditor } from './RichDocumentEditor';

interface RoverPolicyModuleProps {
  policy: RoverOperatingPolicy;
  polls: PolicyAmendmentPoll[];
  currentMember: Member;
  allMembers: Member[];
  onUpdatePolicy: (updatedPolicy: RoverOperatingPolicy) => void;
  onCreatePoll: (newPoll: PolicyAmendmentPoll) => void;
  onCastVote: (pollId: string, vote: PolicyVote) => void;
  onFinalizePoll: (pollId: string, outcome: 'Passed & Implemented' | 'Defeated', newPolicyContent?: string) => void;
}

export const RoverPolicyModule: React.FC<RoverPolicyModuleProps> = ({
  policy,
  polls = [],
  currentMember,
  allMembers = [],
  onUpdatePolicy,
  onCreatePoll,
  onCastVote,
  onFinalizePoll,
}) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'polls' | 'history'>('policy');
  const [isNewPollModalOpen, setIsNewPollModalOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<PolicyAmendmentPoll | null>(polls[0] || null);

  // Form State for Secretary / Council proposing an amendment
  const [pollTitle, setPollTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [proposedContent, setProposedContent] = useState(policy?.content || '');
  const [votingDurationDays, setVotingDurationDays] = useState<number>(7); // Default 1 week minimum

  // Roles check
  const isSuperAdmin = currentMember?.isSuperAdmin || currentMember?.councilRole === 'Superadmin';
  const isCouncil = currentMember ? (currentMember.councilRole !== 'Member' || isSuperAdmin) : false;
  const isSecretary = currentMember?.councilRole === 'Secretary' || currentMember?.councilRole === 'Chairperson' || isSuperAdmin;

  const activePolls = polls.filter((p) => p.status === 'Active Voting');
  const pastPolls = polls.filter((p) => p.status !== 'Active Voting');

  const handleOpenProposeModal = () => {
    setProposedContent(policy?.content || '');
    setPollTitle(`Amendment to ${policy?.title || 'Operating Policy'}`);
    setRationale('');
    setVotingDurationDays(7);
    setIsNewPollModalOpen(true);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollTitle.trim() || !proposedContent.trim()) {
      alert('Please fill in the amendment title and proposed policy text.');
      return;
    }

    if (votingDurationDays < 7) {
      alert('Mandatory Policy Rule: Voting duration must be at least 1 week (7 days).');
      return;
    }

    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    const deadlineDate = new Date(today);
    deadlineDate.setDate(deadlineDate.getDate() + votingDurationDays);
    const deadlineStr = deadlineDate.toISOString().split('T')[0];

    const newPoll: PolicyAmendmentPoll = {
      id: `poll-${Date.now()}`,
      organisationId: currentMember?.organisationId || 'org-meyvaa',
      title: pollTitle,
      proposedBySecretaryName: currentMember?.name || 'Council Secretary',
      proposedBySecretaryId: currentMember?.id || 'm-3',
      originalPolicyVersion: policy?.version || 'v2.4',
      proposedPolicyContent: proposedContent,
      rationale: rationale || 'Council proposed Operating Policy amendment for crew referendum.',
      startDate: startDateStr,
      votingDeadline: deadlineStr,
      status: 'Active Voting',
      votes: [],
      createdAt: startDateStr,
    };

    onCreatePoll(newPoll);
    setSelectedPoll(newPoll);
    setIsNewPollModalOpen(false);
    setActiveTab('polls');
    alert(`Referendum Poll successfully initiated! Voting deadline set to ${deadlineStr} (Minimum 1 week). All crew members can now vote.`);
  };

  const handleVote = (poll: PolicyAmendmentPoll, choice: 'Yea' | 'Nay') => {
    if (!currentMember) return;

    const newVote: PolicyVote = {
      memberId: currentMember.id,
      memberName: currentMember.name,
      choice,
      votedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    onCastVote(poll.id, newVote);
  };

  const handleSumUpAndFinalize = (poll: PolicyAmendmentPoll) => {
    const yeas = poll.votes.filter((v) => v.choice === 'Yea').length;
    const nays = poll.votes.filter((v) => v.choice === 'Nay').length;

    const outcome = yeas > nays ? 'Passed & Implemented' : 'Defeated';

    if (
      window.confirm(
        `Sum Up & Finalize Referendum Results:\n\n` +
        `• YEA (In Favor): ${yeas} votes\n` +
        `• NAY (Against): ${nays} votes\n\n` +
        `Result: ${outcome.toUpperCase()}\n` +
        (yeas > nays
          ? `The Operating Policy will be AUTOMATICALLY UPDATED with the new amendment.`
          : `The amendment was rejected by majority. Current policy remains unchanged.`)
      )
    ) {
      if (yeas > nays) {
        // Update policy
        const updatedPolicy: RoverOperatingPolicy = {
          ...policy,
          version: `v${(parseFloat(policy.version.replace(/[^0-9.]/g, '')) + 0.1).toFixed(1)} (Amended)`,
          content: poll.proposedPolicyContent,
          lastUpdated: new Date().toISOString().split('T')[0],
          updatedBy: `Referendum (${poll.title})`,
        };
        onUpdatePolicy(updatedPolicy);
      }

      onFinalizePoll(poll.id, outcome, yeas > nays ? poll.proposedPolicyContent : undefined);
      alert(`Referendum results recorded: ${outcome}!`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#FFF0F0] via-white to-[#FFF0F0] border border-[#FF9999] rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#800000] text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
                <Crown className="w-3.5 h-3.5 text-white" /> Council Governance Engine
              </span>
              <span className="text-xs text-slate-700 font-mono font-bold bg-white px-2.5 py-0.5 rounded-full border border-[#FF9999]">
                Active Policy: {policy?.version || 'v2.4'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#800000] tracking-tight flex items-center gap-2">
              <span>Rover Operating Policy & Democratic Referendums</span>
            </h1>
            <p className="text-xs text-slate-700 max-w-2xl leading-relaxed">
              The Council holds authority to propose bylaw revisions. Every proposed policy change requires a mandatory minimum 1-week crew referendum vote. Amendments are implemented if <strong className="text-emerald-700">Yeas exceed Nays</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isCouncil && (
              <button
                id="propose-policy-amendment-btn"
                type="button"
                onClick={handleOpenProposeModal}
                className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>Propose Policy Amendment</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-t border-[#FF9999] mt-5 pt-4 text-xs">
          <button
            id="tab-operating-policy"
            onClick={() => setActiveTab('policy')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'policy'
                ? 'bg-[#800000] text-white !text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FFF0F0] border border-[#FF9999]'
            }`}
          >
            <FileText className={`w-4 h-4 ${activeTab === 'policy' ? 'text-white' : 'text-[#800000]'}`} />
            <span>Active Operating Policy</span>
          </button>

          <button
            id="tab-referendum-polls"
            onClick={() => setActiveTab('polls')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'polls'
                ? 'bg-[#800000] text-white !text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FFF0F0] border border-[#FF9999]'
            }`}
          >
            <Vote className={`w-4 h-4 ${activeTab === 'polls' ? 'text-white' : 'text-[#800000]'}`} />
            <span>Active Referendum Polls</span>
            {activePolls.length > 0 && (
              <span className="bg-[#FF3333] text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                {activePolls.length} Active
              </span>
            )}
          </button>

          <button
            id="tab-past-referendums"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#800000] text-white !text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-[#FFF0F0] border border-[#FF9999]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${activeTab === 'history' ? 'text-white' : 'text-[#800000]'}`} />
            <span>Past Referendum History ({pastPolls.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ACTIVE OPERATING POLICY */}
      {activeTab === 'policy' && (
        <div className="bg-white border border-[#FF9999] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#FF9999] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#800000]">{policy?.title || 'Rover Operating Policy'}</h2>
                <span className="bg-[#FFF0F0] text-[#800000] border border-[#FF9999] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md">
                  Official Enforced Policy
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Last Updated: {policy?.lastUpdated || '2026-07-01'} • Approved by: {policy?.updatedBy || 'Crew Referendum'}
              </p>
            </div>

            {isCouncil && (
              <button
                id="initiate-amendment-draft-btn"
                type="button"
                onClick={handleOpenProposeModal}
                className="bg-[#FFF0F0] hover:bg-[#ffe5e5] text-[#800000] border border-[#FF9999] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-sm"
              >
                <Edit3 className="w-4 h-4 text-[#800000]" />
                <span>Initiate Amendment Draft</span>
              </button>
            )}
          </div>

          {/* Policy Document Content */}
          <div className="bg-[#FFF0F0]/50 border border-[#FF9999] rounded-2xl p-6 text-slate-800 text-sm leading-relaxed space-y-4 font-sans">
            <div className="prose max-w-none space-y-4">
              {(policy?.content || '').split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-xl font-black text-[#800000] border-b border-[#FF9999] pb-2 mt-4">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-[#800000] mt-4 border-l-3 border-[#800000] pl-3">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('• ') || line.startsWith('- ') || /^\d+\.\s/.test(line)) {
                  return (
                    <div key={idx} className="ml-4 text-slate-800 flex items-start gap-2">
                      <span className="text-[#800000] font-bold">•</span>
                      <span>{line.replace(/^([•-]|(\d+\.))\s*/, '')}</span>
                    </div>
                  );
                }
                if (!line.trim()) return <div key={idx} className="h-1" />;
                return <p key={idx} className="text-slate-800">{line}</p>;
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE REFERENDUM POLLS */}
      {activeTab === 'polls' && (
        <div className="space-y-6">
          {activePolls.length === 0 ? (
            <div className="bg-white border border-[#FF9999] rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <Vote className="w-12 h-12 text-[#800000]/60 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Active Policy Referendum Polls</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                There are currently no open voting polls for Operating Policy changes. When the Council proposes a change, the Secretary will open a minimum 1-week referendum here.
              </p>
              {isCouncil && (
                <button
                  id="empty-propose-amendment-btn"
                  type="button"
                  onClick={handleOpenProposeModal}
                  className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white font-bold px-4 py-2 rounded-xl text-xs transition inline-flex items-center gap-1.5 mt-2 cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                  <span>Propose Amendment Now</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activePolls.map((poll) => {
                const totalVotes = poll.votes.length;
                const yeas = poll.votes.filter((v) => v.choice === 'Yea').length;
                const nays = poll.votes.filter((v) => v.choice === 'Nay').length;
                const totalEligible = allMembers.length || 1;
                const yeaPercent = totalVotes > 0 ? Math.round((yeas / totalVotes) * 100) : 0;
                const nayPercent = totalVotes > 0 ? Math.round((nays / totalVotes) * 100) : 0;

                const userVote = poll.votes.find((v) => v.memberId === currentMember?.id);

                return (
                  <div
                    key={poll.id}
                    className="bg-white border-2 border-[#FF9999] rounded-3xl p-6 shadow-md space-y-6 relative overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#FF9999] pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#FFF0F0] text-[#FF3333] border border-[#FF9999] px-3 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#FF3333] animate-spin" /> Active Voting
                          </span>
                          <span className="text-xs text-slate-600 font-mono">
                            Initiated by Secretary: {poll.proposedBySecretaryName}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-[#800000]">{poll.title}</h2>
                        <p className="text-xs text-slate-600">
                          Voting Period: <span className="font-semibold text-slate-800">{poll.startDate}</span> to <span className="font-semibold text-[#800000]">{poll.votingDeadline}</span> (Min. 1 Week)
                        </p>
                      </div>

                      {/* Secretary Sum Up Button */}
                      {(isSecretary || isCouncil) && (
                        <button
                          id={`sumup-poll-btn-${poll.id}`}
                          type="button"
                          onClick={() => handleSumUpAndFinalize(poll)}
                          className="bg-[#800000] hover:bg-[#6b0000] text-white !text-white font-bold px-4 py-2 rounded-2xl text-xs transition shadow-sm flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Sum Up & Finalize Results</span>
                        </button>
                      )}
                    </div>

                    {/* Rationale & Proposed Changes */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-[#FFF0F0] border border-[#FF9999] rounded-2xl p-4 space-y-2">
                        <span className="text-xs font-bold text-[#800000] block uppercase tracking-wider">
                          Council Rationale
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed">{poll.rationale}</p>
                      </div>

                      <div className="bg-[#FFF0F0] border border-[#FF9999] rounded-2xl p-4 space-y-2">
                        <span className="text-xs font-bold text-[#800000] block uppercase tracking-wider">
                          Proposed Policy Amendment
                        </span>
                        <div className="bg-white p-3 rounded-xl border border-[#FF9999] text-xs font-mono text-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {poll.proposedPolicyContent}
                        </div>
                      </div>
                    </div>

                    {/* Live Tally Bar */}
                    <div className="bg-[#FFF0F0] border border-[#FF9999] rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 text-[#800000]">
                          <Users className="w-4 h-4 text-[#800000]" /> Referendum Vote Tally ({totalVotes} / {totalEligible} Members Voted)
                        </span>
                        <span className="font-mono text-slate-600">
                          Rule: Yeas &gt; Nays = Pass
                        </span>
                      </div>

                      {/* Vote Bar */}
                      <div className="space-y-2">
                        <div className="h-4 bg-white rounded-full overflow-hidden flex border border-[#FF9999]">
                          <div
                            style={{ width: `${yeaPercent}%` }}
                            className="bg-[#800000] h-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                          >
                            {yeaPercent > 10 && `${yeaPercent}% Yea`}
                          </div>
                          <div
                            style={{ width: `${nayPercent}%` }}
                            className="bg-[#FF3333] h-full transition-all duration-500 flex items-center justify-center text-[10px] font-black text-white"
                          >
                            {nayPercent > 10 && `${nayPercent}% Nay`}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#800000] inline-block" />
                            <span className="font-bold text-[#800000]">YEA (In Favor): {yeas} votes ({yeaPercent}%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#FF3333] inline-block" />
                            <span className="font-bold text-[#FF3333]">NAY (Against): {nays} votes ({nayPercent}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Member Casting Vote Panel */}
                    <div className="bg-white border border-[#FF9999] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-[#800000] block">Cast Your Referendum Vote</span>
                        <p className="text-[11px] text-slate-600">
                          Logged in as: <strong className="text-slate-900">{currentMember?.name}</strong> ({currentMember?.councilRole}). Your vote is confidential and recorded.
                        </p>
                        {userVote && (
                          <div className="mt-2 text-xs font-semibold text-[#800000] flex items-center gap-1">
                            <Check className="w-4 h-4 text-[#800000]" /> You currently voted: <strong className="uppercase underline ml-1">{userVote.choice}</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          id={`vote-yea-btn-${poll.id}`}
                          type="button"
                          onClick={() => handleVote(poll, 'Yea')}
                          className={`px-5 py-3 rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-sm cursor-pointer ${
                            userVote?.choice === 'Yea'
                              ? 'bg-[#800000] text-white !text-white ring-2 ring-[#800000]'
                              : 'bg-[#FFF0F0] hover:bg-[#800000] text-[#800000] hover:text-white border border-[#FF9999]'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Vote YEA (In Favor)</span>
                        </button>

                        <button
                          id={`vote-nay-btn-${poll.id}`}
                          type="button"
                          onClick={() => handleVote(poll, 'Nay')}
                          className={`px-5 py-3 rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-sm cursor-pointer ${
                            userVote?.choice === 'Nay'
                              ? 'bg-[#FF3333] text-white !text-white ring-2 ring-[#FF3333]'
                              : 'bg-[#FFF0F0] hover:bg-[#FF3333] text-[#FF3333] hover:text-white border border-[#FF9999]'
                          }`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Vote NAY (Against)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAST REFERENDUM HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white border border-[#FF9999] rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-[#FF9999] pb-3">
            <h2 className="text-base font-bold text-[#800000]">Past Referendum Results & History</h2>
            <p className="text-xs text-slate-600">All concluded crew votes on Operating Policy changes</p>
          </div>

          {pastPolls.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No past referendum history records yet.</p>
          ) : (
            <div className="space-y-4">
              {pastPolls.map((poll) => {
                const yeas = poll.votes.filter((v) => v.choice === 'Yea').length;
                const nays = poll.votes.filter((v) => v.choice === 'Nay').length;
                const passed = poll.status === 'Passed & Implemented';

                return (
                  <div key={poll.id} className="bg-[#FFF0F0] border border-[#FF9999] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        passed
                          ? 'bg-[#FFF0F0] text-[#800000] border-[#FF9999]'
                          : 'bg-[#FFF0F0] text-[#FF3333] border-[#FF9999]'
                      }`}>
                        {poll.status}
                      </span>
                      <span className="text-xs text-slate-600 font-mono">Concluded {poll.votingDeadline}</span>
                    </div>

                    <h3 className="font-bold text-sm text-[#800000]">{poll.title}</h3>
                    <p className="text-xs text-slate-700">{poll.rationale}</p>

                    <div className="bg-white p-3 rounded-xl text-xs flex items-center justify-between text-slate-800 border border-[#FF9999]">
                      <span>Total Votes Cast: <strong>{poll.votes.length}</strong></span>
                      <span className="text-[#800000] font-bold">Yeas: {yeas}</span>
                      <span className="text-[#FF3333] font-bold">Nays: {nays}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PROPOSE AMENDMENT MODAL */}
      {isNewPollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-[#FF9999] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn text-slate-900 my-8">
            <div className="flex items-center justify-between border-b border-[#FF9999] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] border border-[#FF9999] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-[#800000]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#800000]">Propose Policy Amendment</h3>
                  <p className="text-[11px] text-slate-600">Secretary / Council Referendum Initiation</p>
                </div>
              </div>
              <button
                id="close-propose-poll-modal-btn"
                type="button"
                onClick={() => setIsNewPollModalOpen(false)}
                className="text-slate-600 hover:text-slate-900 text-xs font-semibold px-2.5 py-1 bg-[#FFF0F0] hover:bg-[#ffe5e5] border border-[#FF9999] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreatePollSubmit} className="space-y-4">
              <div className="bg-[#FFF0F0] border border-[#FF9999] p-3.5 rounded-2xl text-xs text-slate-800 space-y-1">
                <span className="font-bold text-[#800000] flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-[#800000]" /> Mandated Governance Rule
                </span>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  The Council has authority to edit Operating Policy, but changes MUST be voted on by all members for a <strong>minimum of 1 week (7 days)</strong> before taking effect. If Yeas &gt; Nays, the policy updates automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amendment Title / Short Subject *
                </label>
                <input
                  id="poll-title-input"
                  type="text"
                  required
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="e.g. Revision to Article II Section 3 (Attendance Minimums)"
                  className="w-full bg-[#FFF0F0]/50 border border-[#FF9999] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rationale / Explanation for Change *
                </label>
                <textarea
                  id="poll-rationale-input"
                  required
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why the Council is recommending this Operating Policy revision..."
                  className="w-full bg-[#FFF0F0]/50 border border-[#FF9999] rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Voting Period Duration * (Mandatory Minimum 1 Week)
                </label>
                <select
                  id="poll-duration-select"
                  value={votingDurationDays}
                  onChange={(e) => setVotingDurationDays(parseInt(e.target.value))}
                  className="w-full bg-[#FFF0F0]/50 border border-[#FF9999] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#800000]"
                >
                  <option value={7}>1 Week (7 Days) - Mandatory Minimum</option>
                  <option value={10}>10 Days</option>
                  <option value={14}>2 Weeks (14 Days)</option>
                  <option value={21}>3 Weeks (21 Days)</option>
                  <option value={30}>1 Month (30 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proposed Full Policy Content *
                </label>
                <div className="bg-[#FFF0F0]/50 border border-[#FF9999] rounded-2xl p-2 max-h-72 overflow-y-auto">
                  <textarea
                    id="poll-content-textarea"
                    required
                    rows={10}
                    value={proposedContent}
                    onChange={(e) => setProposedContent(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-900 p-2 font-mono focus:outline-none resize-y"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="poll-cancel-btn"
                  type="button"
                  onClick={() => setIsNewPollModalOpen(false)}
                  className="px-4 py-2.5 bg-white hover:bg-[#FFF0F0] text-slate-700 text-xs font-bold rounded-xl transition border border-[#FF9999] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="poll-submit-btn"
                  type="submit"
                  className="px-5 py-2.5 bg-[#800000] hover:bg-[#6b0000] text-white !text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Initiate Crew Referendum Poll</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
