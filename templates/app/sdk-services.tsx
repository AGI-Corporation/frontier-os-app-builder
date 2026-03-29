import { FrontierSDK } from '@frontiertower/frontier-sdk';
import type { FrontierServices } from './frontier-services';

export function createSdkServices(sdk: FrontierSDK): FrontierServices {
  const wallet = sdk.getWallet();
  const storage = sdk.getStorage();
  const chain = sdk.getChain();
  const user = sdk.getUser();
  const partnerships = sdk.getPartnerships();
  const thirdParty = sdk.getThirdParty();
  const communities = sdk.getCommunities();
  const events = sdk.getEvents();
  const offices = sdk.getOffices();
  const navigation = sdk.getNavigation();

  return {
    wallet: {
      getBalance: () => wallet.getBalance(),
      getBalanceFormatted: () => wallet.getBalanceFormatted(),
      getAddress: () => wallet.getAddress(),
      getSmartAccount: () => wallet.getSmartAccount(),
      transferERC20: (tokenAddress, to, amount, overrides) => wallet.transferERC20(tokenAddress, to, amount, overrides),
      approveERC20: (tokenAddress, spender, amount, overrides) => wallet.approveERC20(tokenAddress, spender, amount, overrides),
      transferNative: (to, amount, overrides) => wallet.transferNative(to, amount, overrides),
      executeCall: (call, overrides) => wallet.executeCall(call, overrides),
      executeBatchCall: (calls, overrides) => wallet.executeBatchCall(calls, overrides),
      transferFrontierDollar: (to, amount, overrides) => wallet.transferFrontierDollar(to, amount, overrides),
      transferInternalFrontierDollar: (to, amount, overrides) => wallet.transferInternalFrontierDollar(to, amount, overrides),
      transferOverallFrontierDollar: (to, amount, overrides) => wallet.transferOverallFrontierDollar(to, amount, overrides),
      getSupportedTokens: () => wallet.getSupportedTokens(),
      swap: (sourceToken, targetToken, sourceNetwork, targetNetwork, amount) => wallet.swap(sourceToken, targetToken, sourceNetwork, targetNetwork, amount),
      quoteSwap: (sourceToken, targetToken, sourceNetwork, targetNetwork, amount) => wallet.quoteSwap(sourceToken, targetToken, sourceNetwork, targetNetwork, amount),
      getUsdDepositInstructions: () => wallet.getUsdDepositInstructions(),
      getEurDepositInstructions: () => wallet.getEurDepositInstructions(),
      getLinkedBanks: () => wallet.getLinkedBanks(),
      linkUsBankAccount: (accountOwnerName, bankName, routingNumber, accountNumber, checkingOrSavings, address) => wallet.linkUsBankAccount(accountOwnerName, bankName, routingNumber, accountNumber, checkingOrSavings, address),
      linkEuroAccount: (accountOwnerName, accountOwnerType, firstName, lastName, ibanAccountNumber, bic) => wallet.linkEuroAccount(accountOwnerName, accountOwnerType, firstName, lastName, ibanAccountNumber, bic),
      deleteLinkedBank: (bankId) => wallet.deleteLinkedBank(bankId),
      getDeprecatedSmartAccounts: () => wallet.getDeprecatedSmartAccounts(),
    },
    storage: {
      get: <T,>(key: string) => storage.get<T>(key),
      set: (key, value) => storage.set(key, value),
      remove: (key) => storage.remove(key),
      clear: () => storage.clear(),
    },
    chain: {
      getCurrentNetwork: () => chain.getCurrentNetwork(),
      getAvailableNetworks: () => chain.getAvailableNetworks(),
      switchNetwork: (network) => chain.switchNetwork(network),
      getCurrentChainConfig: () => chain.getCurrentChainConfig(),
      getContractAddresses: () => chain.getContractAddresses(),
    },
    user: {
      getDetails: () => user.getDetails(),
      getProfile: () => user.getProfile(),
      getReferralOverview: () => user.getReferralOverview(),
      getReferralDetails: (page) => user.getReferralDetails(page),
      addUserContact: (data) => user.addUserContact(data),
      getOrCreateKyc: (redirectUri) => user.getOrCreateKyc(redirectUri),
      createSignupRequest: (payload) => user.createSignupRequest(payload),
      getVerifiedAccessControls: () => user.getVerifiedAccessControls(),
    },
    partnerships: {
      createSponsorPass: (payload) => partnerships.createSponsorPass(payload),
      listActiveSponsorPasses: (payload) => partnerships.listActiveSponsorPasses(payload),
      listAllSponsorPasses: (payload) => partnerships.listAllSponsorPasses(payload),
      listSponsors: (payload) => partnerships.listSponsors(payload),
      getSponsor: (payload) => partnerships.getSponsor(payload),
      getSponsorPass: (payload) => partnerships.getSponsorPass(payload),
      revokeSponsorPass: (payload) => partnerships.revokeSponsorPass(payload),
    },
    thirdParty: {
      listDevelopers: (payload) => thirdParty.listDevelopers(payload),
      getDeveloper: (payload) => thirdParty.getDeveloper(payload),
      updateDeveloper: (payload) => thirdParty.updateDeveloper(payload),
      rotateDeveloperApiKey: (payload) => thirdParty.rotateDeveloperApiKey(payload),
      listApps: (payload) => thirdParty.listApps(payload),
      createApp: (payload) => thirdParty.createApp(payload),
      getApp: (payload) => thirdParty.getApp(payload),
      updateApp: (payload) => thirdParty.updateApp(payload),
      deleteApp: (payload) => thirdParty.deleteApp(payload),
      listWebhooks: (payload) => thirdParty.listWebhooks(payload),
      createWebhook: (payload) => thirdParty.createWebhook(payload),
      getWebhook: (payload) => thirdParty.getWebhook(payload),
      updateWebhook: (payload) => thirdParty.updateWebhook(payload),
      deleteWebhook: (payload) => thirdParty.deleteWebhook(payload),
      rotateWebhookSigningKey: (payload) => thirdParty.rotateWebhookSigningKey(payload),
    },
    communities: {
      listCommunities: (payload) => communities.listCommunities(payload),
      getCommunity: (payload) => communities.getCommunity(payload),
      createInternshipPass: (payload) => communities.createInternshipPass(payload),
      listInternshipPasses: (payload) => communities.listInternshipPasses(payload),
      getInternshipPass: (payload) => communities.getInternshipPass(payload),
      revokeInternshipPass: (payload) => communities.revokeInternshipPass(payload),
      createReassignRequest: (payload) => communities.createReassignRequest(payload),
      listReassignRequests: (payload) => communities.listReassignRequests(payload),
      getReassignRequest: (payload) => communities.getReassignRequest(payload),
      acceptReassignRequest: (payload) => communities.acceptReassignRequest(payload),
      rejectReassignRequest: (payload) => communities.rejectReassignRequest(payload),
    },
    events: {
      listEvents: (payload) => events.listEvents(payload),
      createEvent: (payload) => events.createEvent(payload),
      addEventHost: (payload) => events.addEventHost(payload),
      listLocations: (payload) => events.listLocations(payload),
      listRoomBookings: (payload) => events.listRoomBookings(payload),
      createRoomBooking: (payload) => events.createRoomBooking(payload),
    },
    offices: {
      createAccessPass: (payload) => offices.createAccessPass(payload),
      listAccessPasses: (payload) => offices.listAccessPasses(payload),
      getAccessPass: (payload) => offices.getAccessPass(payload),
      revokeAccessPass: (payload) => offices.revokeAccessPass(payload),
    },
    navigation: {
      openApp: (appId, options) => navigation.openApp(appId, options),
      close: () => navigation.close(),
      onDeepLink: (callback) => navigation.onDeepLink(callback),
    },
  };
}
