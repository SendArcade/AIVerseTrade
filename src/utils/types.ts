export type Data = {
    name: string;
    symbol: string;
    description: string;
    image: string;
    showName?: boolean;
    createdOn?: string;
    twitter?: string;
    telegram?: string;
    website?: string;
}
export type TokenPageProps = {
    params: Promise<{ address: string }>; 
  };