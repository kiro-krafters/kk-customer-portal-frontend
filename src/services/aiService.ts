import { lookupByPolicyNumber, lookupByName } from '../data/customers';
import type { Customer, Policy, Claim } from '../data/customers';

export interface Message {
  from: 'bot' | 'user';
  text: string;
}

type ConversationState =
  | { stage: 'greeting' }
  | { stage: 'awaiting_policy' }
  | { stage: 'customer_identified'; customer: Customer; policy: Policy }
  | { stage: 'free_chat'; customer: Customer; policy: Policy };

export class KiraAI {
  private state: ConversationState = { stage: 'greeting' };

  getGreeting(): string {
    return "Hi! I'm **Kira**, your AI insurance assistant. 👋\n\nTo get started, please share your **policy number** (e.g. KI-123456) so I can pull up your account.";
  }

  async respond(userMessage: string): Promise<string> {
    const msg = userMessage.trim();

    if (this.state.stage === 'greeting' || this.state.stage === 'awaiting_policy') {
      // Try to extract a policy number from the message
      const policyMatch = msg.match(/KI-\d{6}/i);
      if (policyMatch) {
        const result = lookupByPolicyNumber(policyMatch[0]);
        if (result) {
          this.state = { stage: 'customer_identified', customer: result.customer, policy: result.policy };
          return this.buildWelcomeBack(result.customer, result.policy);
        } else {
          return `I couldn't find a policy with number **${policyMatch[0]}**. Please double-check the number and try again, or type **"agent"** to speak with a representative.`;
        }
      }

      // Try name lookup as fallback
      if (msg.length > 2) {
        const customer = lookupByName(msg);
        if (customer && customer.policies.length > 0) {
          const policy = customer.policies[0];
          this.state = { stage: 'customer_identified', customer, policy };
          return this.buildWelcomeBack(customer, policy);
        }
      }

      this.state = { stage: 'awaiting_policy' };
      return "I need your **policy number** to look up your account (format: KI-XXXXXX). You can find it on your insurance card or welcome email.";
    }

    // Customer is identified — handle free chat
    if (this.state.stage === 'customer_identified' || this.state.stage === 'free_chat') {
      const { customer, policy } = this.state as { customer: Customer; policy: Policy };
      this.state = { stage: 'free_chat', customer, policy };
      return this.handleFreeChat(msg, customer, policy);
    }

    return "I'm not sure I understood that. Could you rephrase?";
  }

  private buildWelcomeBack(customer: Customer, policy: Policy): string {
    const activeClaims = customer.claims.filter((c) => c.status === 'Under Review' || c.status === 'Pending Documents');
    let msg = `Welcome back, **${customer.name}**! 🎉 I've pulled up your account.\n\n`;
    msg += `📋 **Active Policy:** ${policy.policyId} (${policy.type} — ${policy.status})\n`;
    msg += `💰 **Coverage:** $${policy.coverageAmount.toLocaleString()} | Deductible: $${policy.deductible.toLocaleString()}\n`;
    if (activeClaims.length > 0) {
      msg += `\n⚠️ You have **${activeClaims.length}** open claim(s). Type **"claim status"** for details.`;
    } else {
      msg += `\n✅ No open claims on file.`;
    }
    msg += `\n\nHow can I help you today? You can ask about **claims**, **policy details**, **billing**, or type **"agent"** for live support.`;
    return msg;
  }

  private handleFreeChat(msg: string, customer: Customer, policy: Policy): string {
    const lower = msg.toLowerCase();

    // Claim status
    if (lower.includes('claim')) {
      return this.buildClaimResponse(customer);
    }

    // Policy info
    if (lower.includes('policy') || lower.includes('coverage') || lower.includes('covered')) {
      return this.buildPolicyResponse(customer, policy);
    }

    // Billing / premium
    if (lower.includes('billing') || lower.includes('payment') || lower.includes('premium') || lower.includes('due') || lower.includes('pay')) {
      return this.buildBillingResponse(customer, policy);
    }

    // Contact / profile
    if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('address') || lower.includes('my info')) {
      return `Here are your contact details on file:\n\n📧 **Email:** ${customer.email}\n📞 **Phone:** ${customer.phone}\n🏠 **Address:** ${customer.address}\n\nTo update any details, type **"agent"** to speak with a representative.`;
    }

    // All policies
    if (lower.includes('all polic') || lower.includes('my polic') || lower.includes('policies')) {
      return this.buildAllPoliciesResponse(customer);
    }

    // Agent escalation
    if (lower.includes('agent') || lower.includes('human') || lower.includes('representative') || lower.includes('speak to') || lower.includes('talk to')) {
      return `Connecting you to a live agent now. 🔄\n\nAverage wait time is under **2 minutes**. Your account info has been shared with the agent so you won't need to repeat yourself.\n\nPlease hold...`;
    }

    // Help / menu
    if (lower.includes('help') || lower.includes('menu') || lower.includes('options') || lower.includes('what can')) {
      return `Here's what I can help you with:\n\n📋 **"claim status"** — View your open & past claims\n🛡️ **"policy details"** — Coverage, deductible, dates\n💳 **"billing"** — Premium amount & payment info\n📬 **"my info"** — Your contact details on file\n👤 **"agent"** — Connect to a live representative\n\nJust type any of the above!`;
    }

    // Generic fallback with context
    return `I can help you with claims, policy details, or billing for your ${policy.type} policy (${policy.policyId}). What would you like to know?\n\nType **"help"** to see all options, or **"agent"** for live support.`;
  }

  private buildClaimResponse(customer: Customer): string {
    if (customer.claims.length === 0) {
      return `No claims found on your account. If you need to file a new claim, type **"agent"** and a representative will assist you.`;
    }

    let response = `Here are your claims, **${customer.name}**:\n\n`;
    customer.claims.forEach((claim: Claim) => {
      const statusEmoji = {
        'Under Review': '🔍',
        'Approved': '✅',
        'Rejected': '❌',
        'Settled': '💚',
        'Pending Documents': '📎',
      }[claim.status] ?? '📋';

      response += `${statusEmoji} **${claim.claimId}** — ${claim.type}\n`;
      response += `   Status: **${claim.status}**\n`;
      response += `   Amount: $${claim.amount.toLocaleString()}\n`;
      response += `   Filed: ${claim.filedDate}\n`;
      response += `   ${claim.estimatedResolution}\n\n`;
    });

    const pendingDocs = customer.claims.find((c) => c.status === 'Pending Documents');
    if (pendingDocs) {
      response += `⚠️ Action needed: Please submit missing documents for **${pendingDocs.claimId}** to avoid delays.`;
    }

    return response.trim();
  }

  private buildPolicyResponse(customer: Customer, activePolicy: Policy): string {
    let response = `Here are the details for your **${activePolicy.type}** policy:\n\n`;
    response += `📋 **Policy #:** ${activePolicy.policyId}\n`;
    response += `🟢 **Status:** ${activePolicy.status}\n`;
    response += `💰 **Coverage:** $${activePolicy.coverageAmount.toLocaleString()}\n`;
    response += `🔓 **Deductible:** $${activePolicy.deductible.toLocaleString()}\n`;
    response += `💵 **Annual Premium:** $${activePolicy.premium.toLocaleString()}\n`;
    response += `📅 **Valid:** ${activePolicy.startDate} → ${activePolicy.endDate}\n`;

    if (customer.policies.length > 1) {
      response += `\nYou also have **${customer.policies.length - 1}** other policy(ies). Type **"all policies"** to see them.`;
    }

    return response;
  }

  private buildBillingResponse(_customer: Customer, policy: Policy): string {
    const monthly = Math.round(policy.premium / 12);
    return `Here's your billing summary for **${policy.policyId}**:\n\n💵 **Annual Premium:** $${policy.premium.toLocaleString()}\n📆 **Monthly Equivalent:** ~$${monthly}/month\n📅 **Policy Renews:** ${policy.endDate}\n\nFor payment history, upcoming invoices, or to update payment method, type **"agent"** to speak with a billing specialist.`;
  }

  private buildAllPoliciesResponse(customer: Customer): string {
    let response = `You have **${customer.policies.length}** policy(ies) on file:\n\n`;
    customer.policies.forEach((p: Policy) => {
      const statusEmoji = p.status === 'Active' ? '🟢' : p.status === 'Expired' ? '🔴' : '🟡';
      response += `${statusEmoji} **${p.policyId}** — ${p.type} (${p.status})\n`;
      response += `   Coverage: $${p.coverageAmount.toLocaleString()} | Premium: $${p.premium.toLocaleString()}/yr\n\n`;
    });
    return response.trim();
  }

  reset() {
    this.state = { stage: 'greeting' };
  }
}
