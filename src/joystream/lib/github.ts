export const fetchReports = () => {
  const domain = `https://raw.githubusercontent.com/Joystream/community-repo/master/council-reports`
  const apiBase = `https://api.github.com/repos/joystream/community-repo/contents/council-reports`

  const urls: { [key: string]: string } = {
    alexandria: `${apiBase}/alexandria-testnet`,
    archive: `${apiBase}/archived-reports`,
    template: `${domain}/templates/council_report_template_v1.md`,
  }

  ;['alexandria', 'archive'].map((folder) => fetchGithubDir(urls[folder]))

  fetchGithubFile(urls.template)
}

const fetchGithubFile = async (url: string): Promise<string> => {
  const { data } = await axios.get(url)
  return data
}

const fetchGithubDir = async (url: string) => {
  const { data } = await axios.get(url)
  data.forEach(
    async (o: {
      name: string
      type: string
      url: string
      download_url: string
    }) => {
      const match = o.name.match(/^(.+)\.md$/)
      const name = match ? match[1] : o.name
      if (o.type === 'file') {
        const file = await fetchGithubFile(o.download_url)
        // TODO save file
      } else fetchGithubDir(o.url)
    }
  )
}
