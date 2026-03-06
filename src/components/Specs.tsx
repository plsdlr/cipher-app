import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import eipContent from "./EIP-XXXX.md?raw";

// Parse YAML frontmatter and body
const frontmatterMatch = eipContent.match(/^---\n([\s\S]*?)\n---\n*([\s\S]*)$/);
const frontmatter: Record<string, string> = {};
if (frontmatterMatch) {
    for (const line of frontmatterMatch[1].split("\n")) {
        const idx = line.indexOf(":");
        if (idx !== -1) {
            frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
    }
}
const markdown = frontmatterMatch ? frontmatterMatch[2] : eipContent;

const Specs = () => {
    return (
        <div className="home-container">
            <fieldset className="terminal-fieldset">
                <legend>Specs</legend>
                {frontmatterMatch && (
                    <div className="eip-frontmatter">
                        <h2 className="eip-title">
                            EIP-{frontmatter.eip}: {frontmatter.title}
                        </h2>
                        <p className="eip-description">{frontmatter.description}</p>
                        <div className="eip-meta">
                            <span>Author: <strong>{frontmatter.author}</strong></span>
                            <span>Status: <strong>{frontmatter.status}</strong></span>
                            <span>Type: <strong>{frontmatter.type}</strong></span>
                            <span>Category: <strong>{frontmatter.category}</strong></span>
                            <span>Created: <strong>{frontmatter.created}</strong></span>
                            <span>Requires: <strong>EIP-{frontmatter.requires}</strong></span>
                        </div>
                    </div>
                )}
                <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {markdown}
                    </ReactMarkdown>
                </div>
            </fieldset>
        </div>
    );
};

export default Specs;
